// schedule-parser/index.js (Версия с кешированием в JSON)

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const cors = require('cors');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// --- НАСТРОЙКИ ---
const CACHE_DIR = path.join(__dirname, 'cache');
const GROUPS_CACHE_PATH = path.join(CACHE_DIR, 'allGroups.json');
const TEACHERS_CACHE_PATH = path.join(CACHE_DIR, 'allTeachers.json');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах

// --- КОНФИГУРАЦИЯ СЕРВЕРА ---
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

const STUDENT_BASE_URL = 'https://is.agni-rt.ru/index.php?type=1&page=student_schedule_lessons';
const TEACHER_BASE_URL = 'https://is.agni-rt.ru/index.php?type=2&page=teacher_schedule_lessons';
const AXIOS_CONFIG = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Referer': 'https://is.agni-rt.ru/index.php',
        'Origin': 'https://is.agni-rt.ru',
    },
    httpsAgent: httpsAgent,
    responseType: 'arraybuffer',
};
const LOGS_DIR = path.join(__dirname, 'logs');
const REQUEST_LOG_PATH = path.join(LOGS_DIR, 'requests.log');
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || '36646644';

const requestLoggerMiddleware = async (req, res, next) => {
    try {
        // Логируем только успешные запросы к расписанию
        res.on('finish', async () => {
            if (res.statusCode === 200) {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    type: req.body.group_id ? 'group' : 'teacher', // Определяем тип по наличию group_id
                    entityId: req.body.group_id || req.body.teacher_id,
                    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, // Получаем IP пользователя
                };
                // Добавляем запись в конец файла
                await fs.appendFile(REQUEST_LOG_PATH, JSON.stringify(logEntry) + '\n');
            }
        });
    } catch (error) {
        console.error("Failed to log request:", error);
    }
    next();
};

// ======================================================
// =============== ЛОГИКА КЕШИРОВАНИЯ ====================
// ======================================================

async function updateGroupsCache() {
    console.log(`[${new Date().toISOString()}] Starting to update groups cache...`);
    try {
        const facultyResponse = await axios.get(STUDENT_BASE_URL, AXIOS_CONFIG);
        const facultyHtml = iconv.decode(Buffer.from(facultyResponse.data), 'win1251');
        const $f = cheerio.load(facultyHtml);
        const faculties = [];
        $f('a[href*="sp_student.faculty_id.value"]').each((i, element) => {
            const hrefAttr = $f(element).attr('href');
            if (hrefAttr) {
                const idMatch = hrefAttr.match(/faculty_id\.value='(\d+)'/);
                if (idMatch && idMatch[1]) {
                    faculties.push({ id: idMatch[1], name: $f(element).find('div').text().trim() });
                }
            }
        });
        
        let allGroups = [];
        await Promise.all(faculties.map(async (faculty) => {
            const formData = new URLSearchParams();
            formData.append('faculty_id', faculty.id);
            const groupResponse = await axios.post(STUDENT_BASE_URL, formData, AXIOS_CONFIG);
            const groupHtml = iconv.decode(Buffer.from(groupResponse.data), 'win1251');
            const $g = cheerio.load(groupHtml);
            $g('a[href*="sp_student.group_id.value"]').each((j, a) => {
                const hrefAttr = $g(a).attr('href');
                if (hrefAttr) {
                    const idMatch = hrefAttr.match(/group_id\.value='(\d+)'/);
                    if (idMatch && idMatch[1]) {
                        allGroups.push({
                            id: idMatch[1], name: $g(a).text().trim(), facultyId: faculty.id, facultyName: faculty.name
                        });
                    }
                }
            });
        }));

        await fs.writeFile(GROUPS_CACHE_PATH, JSON.stringify({ timestamp: Date.now(), data: allGroups }));
        console.log(`[${new Date().toISOString()}] Groups cache updated successfully.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to update groups cache:`, error.message);
    }
}

async function updateTeachersCache() {
    console.log(`[${new Date().toISOString()}] Starting to update teachers cache...`);
    try {
        const chairResponse = await axios.get(TEACHER_BASE_URL, AXIOS_CONFIG);
        const chairHtml = iconv.decode(Buffer.from(chairResponse.data), 'win1251');
        const $c = cheerio.load(chairHtml);
        const chairs = [];
        $c('select[name="chair_id"] option').each((i, el) => {
            chairs.push({ id: $c(el).attr('value'), name: $c(el).text().trim() });
        });

        let allTeachers = [];
        await Promise.all(chairs.map(async (chair) => {
            const formData = new URLSearchParams();
            formData.append('chair_id', chair.id);
            const teacherResponse = await axios.post(TEACHER_BASE_URL, formData, AXIOS_CONFIG);
            const teacherHtml = iconv.decode(Buffer.from(teacherResponse.data), 'win1251');
            const $t = cheerio.load(teacherHtml);
            $t('select[name="teacher_id"] option').each((j, el) => {
                allTeachers.push({
                    id: $t(el).attr('value'), name: $t(el).text().trim(), chairId: chair.id, chairName: chair.name,
                });
            });
        }));
        
        const uniqueTeachers = allTeachers.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        await fs.writeFile(TEACHERS_CACHE_PATH, JSON.stringify({ timestamp: Date.now(), data: uniqueTeachers }));
        console.log(`[${new Date().toISOString()}] Teachers cache updated successfully.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to update teachers cache:`, error.message);
    }
}

async function initializeCache() {
    try {
        await fs.mkdir(CACHE_DIR);
        console.log("Cache directory created.");
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }

    try {
        await fs.mkdir(LOGS_DIR);
        console.log("Logs directory created.");
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }

    const checkAndUpdateCache = async (filePath, updateFunction) => {
        try {
            const stats = await fs.stat(filePath);
            if (Date.now() - stats.mtime.getTime() > CACHE_TTL) {
                await updateFunction();
            } else {
                console.log(`${path.basename(filePath)} cache is up to date.`);
            }
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.log(`${path.basename(filePath)} cache not found, creating new one...`);
                await updateFunction();
            }
        }
    };

    await checkAndUpdateCache(GROUPS_CACHE_PATH, updateGroupsCache);
    await checkAndUpdateCache(TEACHERS_CACHE_PATH, updateTeachersCache);
}

// ======================================================
// =============== API ЭНДПОИНТЫ =========================
// ======================================================

app.get('/api/faculties', async (req, res) => {
    try {
        const response = await axios.get(STUDENT_BASE_URL, AXIOS_CONFIG);
        const html = iconv.decode(Buffer.from(response.data), 'win1251');
        const $ = cheerio.load(html);
        const faculties = [];
        $('a[href*="sp_student.faculty_id.value"]').each((i, element) => {
            const hrefAttr = $(element).attr('href');
            if (hrefAttr) {
                const idMatch = hrefAttr.match(/faculty_id\.value='(\d+)'/);
                if (idMatch && idMatch[1]) {
                    faculties.push({
                        id: idMatch[1],
                        name: $(element).find('div').text().trim(),
                    });
                }
            }
        });
        res.json(faculties);
    } catch (error) {
        console.error('Error fetching faculties:', error.message);
        res.status(500).json({ error: 'Failed to fetch faculties' });
    }
});

app.get('/api/groups/:facultyId', async (req, res) => {
    const { facultyId } = req.params;
    if (!facultyId) {
        return res.status(400).json({ error: 'Faculty ID is required' });
    }
    try {
        const formData = new URLSearchParams();
        formData.append('faculty_id', facultyId);
        const response = await axios.post(STUDENT_BASE_URL, formData, AXIOS_CONFIG);
        const html = iconv.decode(Buffer.from(response.data), 'win1251');
        const $ = cheerio.load(html);
        const groups = [];
        let currentCourse = 'Неизвестный курс';
        $('td:contains("Группа: ")').next().find('table tr').each((i, tr) => {
            const row = $(tr);
            const courseCell = row.find('td[align="center"]');
            if (courseCell.length > 0) {
                currentCourse = courseCell.contents().first().text().trim();
            }
            row.find('a[href*="sp_student.group_id.value"]').each((j, a) => {
                const hrefAttr = $(a).attr('href');
                if (hrefAttr) {
                    const idMatch = hrefAttr.match(/group_id\.value='(\d+)'/);
                    if (idMatch && idMatch[1]) {
                        groups.push({
                            id: idMatch[1],
                            name: $(a).text().trim(),
                            course: currentCourse,
                        });
                    }
                }
            });
        });
        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error.message);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

app.get('/api/all-groups', async (req, res) => {
    try {
        const fileContent = await fs.readFile(GROUPS_CACHE_PATH, 'utf-8');
        const cacheData = JSON.parse(fileContent);
        res.json(cacheData.data);
    } catch (error) {
        console.error('Error reading groups cache:', error.message);
        res.status(500).json({ error: 'Failed to read groups data' });
    }
});

app.get('/api/all-teachers', async (req, res) => {
    try {
        const fileContent = await fs.readFile(TEACHERS_CACHE_PATH, 'utf-8');
        const cacheData = JSON.parse(fileContent);
        res.json(cacheData.data);
    } catch (error) {
        console.error('Error reading teachers cache:', error.message);
        res.status(500).json({ error: 'Failed to read teachers data' });
    }
});

app.post('/api/schedule', requestLoggerMiddleware, async (req, res) => {
    const { faculty_id, group_id, year_week_number } = req.body;
    if (!faculty_id || !group_id || !year_week_number) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
        const formData = new URLSearchParams();
        formData.append('faculty_id', faculty_id);
        formData.append('group_id', group_id);
        formData.append('year_week_number', year_week_number);
        const response = await axios.post(STUDENT_BASE_URL, formData, AXIOS_CONFIG);
        const html = iconv.decode(Buffer.from(response.data), 'win1251');
        const $ = cheerio.load(html);
        const weekInfo = $('td:contains("Неделя: ")').next().find('td[width="100%"]').text().trim();
        const startDateString = weekInfo.split(' ')[0];
        const dateMap = {};
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(startDateString)) {
            const [day, month, year] = startDateString.split('.').map(Number);
            const mondayDate = new Date(year, month - 1, day);
            const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(mondayDate);
                currentDate.setDate(mondayDate.getDate() + i);
                const d = String(currentDate.getDate()).padStart(2, '0');
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const y = currentDate.getFullYear();
                dateMap[daysOfWeek[i]] = `${d}.${m}.${y}`;
            }
        }
        const schedule = [];
        const mainTable = $('.slt');
        const headers = [];
        mainTable.find('> tbody > tr').first().find('th').slice(1).each((i, th) => {
            headers.push($(th).contents().filter((_, el) => el.type === 'text').text().trim());
        });
        mainTable.find('> tbody > tr').slice(1).each((i, tr) => {
            const time = $(tr).find('th').first().text().trim();
            if (!time) return;
            $(tr).children('td').each((j, dayCell) => {
                const dayName = headers[j];
                if (!dayName) return;
                const cell = $(dayCell);
                if (cell.text().trim() === '') {
                    schedule.push({ day: dayName, date: dateMap[dayName] || '', time: time, isEmpty: true, name: 'Окно', fullName: '', type: '', subgroups: [] });
                    return;
                }
                const isChoiceLessons = cell.find('td.blb').length > 0;
                if (isChoiceLessons) {
                    const lessonCells = cell.find('table.slt_gr_wl > tbody > tr:first-child').children('td');
                    lessonCells.each((k, lessonCellNode) => {
                        const lessonCell = $(lessonCellNode);
                        if (lessonCell.text().trim() === '') return;
                        let lessonType = '';
                        lessonCell.find('span[title]').each((_, span) => {
                            const text = $(span).text().trim();
                            if (text.startsWith('(') && text.endsWith(')')) lessonType = text;
                        });
                        const lesson = { day: dayName, date: dateMap[dayName] || '', time: time, name: lessonCell.find('b').first().text().trim(), fullName: lessonCell.find('b').parent().attr('title')?.trim() || '', type: lessonType, subgroups: [{ room: lessonCell.find('.aud_number').text().trim(), teacher: lessonCell.find('span[title]').last().attr('title')?.trim() || '', teacherShort: lessonCell.find('span[title]').last().text().trim(), subgroupNumber: null }] };
                        schedule.push(lesson);
                    });
                } else {
                    let lessonType = '';
                    cell.find('span[title]').each((_, span) => {
                        const text = $(span).text().trim();
                        if (text.startsWith('(') && text.endsWith(')')) lessonType = text;
                    });
                    const lesson = { day: dayName, date: dateMap[dayName] || '', time: time, name: cell.find('b').first().text().trim(), fullName: cell.find('b').parent().attr('title')?.trim() || '', type: lessonType, subgroups: [] };
                    const subgroupTable = cell.find('table.slt_gr_wl table.slt_gr_wl');
                    if (subgroupTable.length > 0) {
                        const commonRoom = cell.find('.aud_number').first().text().trim();
                        subgroupTable.find('td[width="50%"]').each((_, subTd) => {
                            const subgroupCell = $(subTd);
                            let specificRoom = subgroupCell.find('.aud_number').text().trim();
                            lesson.subgroups.push({ room: specificRoom || commonRoom, teacher: subgroupCell.find('span[title]').last().attr('title')?.trim() || '', teacherShort: subgroupCell.find('span[title]').last().text().trim().replace(/\(\d+\)/, '').trim(), subgroupNumber: subgroupCell.text().match(/\((\d+)\)/)?.[1] || null });
                        });
                    }
                    if (lesson.subgroups.length === 0) {
                        const numberMatch = cell.text().match(/\((\d+)\)$/);
                        lesson.subgroups.push({ room: cell.find('.aud_number').text().trim(), teacher: cell.find('span[title]').last().attr('title')?.trim() || '', teacherShort: cell.find('span[title]').last().text().trim(), subgroupNumber: numberMatch ? numberMatch[1] : null });
                    }
                    schedule.push(lesson);
                }
            });
        });
        res.json({ weekInfo, schedule });
    } catch (error) {
        console.error('Error fetching student schedule:', error.message);
        res.status(500).json({ error: 'Failed to fetch student schedule' });
    }
});

app.post('/api/teacher-schedule', requestLoggerMiddleware, async (req, res) => {
    const { chair_id, teacher_id, year_week_number } = req.body;
    if (!chair_id || !teacher_id || !year_week_number) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    try {
        const formData = new URLSearchParams();
        formData.append('chair_id', chair_id);
        formData.append('teacher_id', teacher_id);
        formData.append('year_week_number', year_week_number);
        const response = await axios.post(TEACHER_BASE_URL, formData, AXIOS_CONFIG);
        const html = iconv.decode(Buffer.from(response.data), 'win1251');
        const $ = cheerio.load(html);
        const weekInfo = $('td:contains("Неделя: ")').next().find('td[width="100%"]').text().trim();
        const startDateString = weekInfo.split(' ')[0];
        const dateMap = {};
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(startDateString)) {
            const [day, month, year] = startDateString.split('.').map(Number);
            const mondayDate = new Date(year, month - 1, day);
            const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(mondayDate);
                currentDate.setDate(mondayDate.getDate() + i);
                const d = String(currentDate.getDate()).padStart(2, '0');
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const y = currentDate.getFullYear();
                dateMap[daysOfWeek[i]] = `${d}.${m}.${y}`;
            }
        }
        const schedule = [];
        const mainTable = $('.slt');
        const headers = [];
        mainTable.find('> tbody > tr').first().find('th').slice(1).each((i, th) => {
            headers.push($(th).contents().filter((_, el) => el.type === 'text').text().trim());
        });
        mainTable.find('> tbody > tr').slice(1).each((i, tr) => {
            const time = $(tr).find('th').first().text().trim();
            if (!time) return;
            $(tr).children('td').each((j, dayCell) => {
                const dayName = headers[j];
                if (!dayName) return;
                const cell = $(dayCell).find('td[width="100%"]');
                if (cell.text().trim() === '') {
                    schedule.push({ day: dayName, date: dateMap[dayName] || '', time: time, isEmpty: true, name: 'Окно', groups: [] });
                    return;
                }
                let lessonType = '';
                cell.find('span[title]').each((_, span) => {
                    const text = $(span).text().trim();
                    if (text.startsWith('(') && text.endsWith(')')) lessonType = text;
                });
                const lessonName = cell.find('b').first().text().trim();
                const room = cell.find('.aud_number').text().trim();
                let fullText = cell.text().trim();
                fullText = fullText.replace(lessonName, '');
                fullText = fullText.replace(lessonType, '');
                fullText = fullText.replace(room, '');
                const groups = fullText.trim().split(',').map(g => g.trim()).filter(Boolean);
                const lesson = {
                    day: dayName, date: dateMap[dayName] || '', time: time, name: lessonName,
                    fullName: cell.find('b').parent().attr('title')?.trim() || '', type: lessonType, room: room, groups: groups
                };
                schedule.push(lesson);
            });
        });
        res.json({ weekInfo, schedule });
    } catch (error) {
        console.error('Error fetching teacher schedule:', error.message);
        res.status(500).json({ error: 'Failed to fetch teacher schedule' });
    }
});

app.get('/api/admin/stats/:secretKey', async (req, res) => {
    // 1. Проверяем секретный ключ
    if (req.params.secretKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const logData = await fs.readFile(REQUEST_LOG_PATH, 'utf-8');
        const logEntries = logData.split('\n').filter(Boolean).map(JSON.parse);

        // 2. Анализируем данные
        const totalRequests = logEntries.length;
        
        const requestsByEntity = logEntries.reduce((acc, entry) => {
            acc[entry.entityId] = (acc[entry.entityId] || 0) + 1;
            return acc;
        }, {});
        
        const top10 = Object.entries(requestsByEntity)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));

        const uniqueUsers = new Set(logEntries.map(e => e.ip)).size;

        // 3. Отдаем статистику
        res.json({
            totalRequests,
            uniqueUsers,
            top10,
        });

    } catch (error) {
        if (error.code === 'ENOENT') { // Если лог-файл еще не создан
            return res.json({ totalRequests: 0, uniqueUsers: 0, top10: [] });
        }
        console.error("Error reading stats:", error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// ======================================================
// =============== ЗАПУСК СЕРВЕРА =======================
// ======================================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    initializeCache();
    setInterval(initializeCache, 24 * 60 * 60 * 1000); 
});