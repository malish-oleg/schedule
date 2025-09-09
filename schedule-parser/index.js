const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

const BASE_URL = 'https://is.agni-rt.ru/index.php?type=1&page=student_schedule_lessons';
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

app.get('/api/faculties', async (req, res) => {
    try {
        const response = await axios.get(BASE_URL, AXIOS_CONFIG);
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

        if (faculties.length === 0) {
            console.error("Парсер не смог найти факультеты с исправленным регулярным выражением.");
            require('fs').writeFileSync('debug_faculties_final_attempt.html', html); // На всякий случай
            return res.status(404).json({ error: 'Could not find any faculties on the page.' });
        }

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

        const response = await axios.post(BASE_URL, formData, AXIOS_CONFIG);
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

app.post('/api/schedule', async (req, res) => {
    const { faculty_id, group_id, year_week_number } = req.body;

    if (!faculty_id || !group_id || !year_week_number) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const formData = new URLSearchParams();
        formData.append('faculty_id', faculty_id);
        formData.append('group_id', group_id);
        formData.append('year_week_number', year_week_number);

        const response = await axios.post(BASE_URL, formData, AXIOS_CONFIG);
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
        } else {
            console.warn("Could not parse start date from weekInfo:", weekInfo);
        }

        const schedule = [];
        const mainTable = $('.slt');

        const headers = [];
        mainTable.find('> tbody > tr').first().find('th').slice(1).each((i, th) => {
            const dayText = $(th).contents().filter((_, el) => el.type === 'text').text().trim();
            headers.push(dayText);
        });

        mainTable.find('> tbody > tr').slice(1).each((i, tr) => {
            const time = $(tr).find('th').first().text().trim();
            if (!time) return;

            $(tr).children('td').each((j, dayCell) => {
                const dayName = headers[j] || '';
                const cell = $(dayCell);
                if (cell.text().trim() === '') {
                    schedule.push({
                        day: dayName,
                        date: dateMap[dayName] || '',
                        time: time,
                        name: 'Окно',
                        isEmpty: true,
                        fullName: '',
                        type: '',
                        subgroups: []
                    });
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

                        const lesson = {
                            day: dayName, date: dateMap[dayName] || '', time: time,
                            name: lessonCell.find('b').first().text().trim(),
                            fullName: lessonCell.find('b').parent().attr('title')?.trim() || '',
                            type: lessonType,
                            subgroups: [{
                                room: lessonCell.find('.aud_number').text().trim(),
                                teacher: lessonCell.find('span[title]').last().attr('title')?.trim() || '',
                                teacherShort: lessonCell.find('span[title]').last().text().trim(),
                                subgroupNumber: null
                            }]
                        };
                        schedule.push(lesson);
                    });

                } else {
                    let lessonType = '';
                    cell.find('span[title]').each((_, span) => {
                        const text = $(span).text().trim();
                        if (text.startsWith('(') && text.endsWith(')')) lessonType = text;
                    });
                    
                    const lesson = {
                        day: dayName, date: dateMap[dayName] || '', time: time,
                        name: cell.find('b').first().text().trim(),
                        fullName: cell.find('b').parent().attr('title')?.trim() || '',
                        type: lessonType,
                        subgroups: []
                    };
                    
                    const subgroupTable = cell.find('table.slt_gr_wl table.slt_gr_wl');
                    if (subgroupTable.length > 0) {
                        const commonRoom = cell.find('.aud_number').first().text().trim();
                        subgroupTable.find('td[width="50%"]').each((_, subTd) => {
                            const subgroupCell = $(subTd);
                            let specificRoom = subgroupCell.find('.aud_number').text().trim();
                            lesson.subgroups.push({
                                room: specificRoom || commonRoom,
                                teacher: subgroupCell.find('span[title]').last().attr('title')?.trim() || '',
                                teacherShort: subgroupCell.find('span[title]').last().text().trim().replace(/\(\d+\)/, '').trim(),
                                subgroupNumber: subgroupCell.text().match(/\((\d+)\)/)?.[1] || null
                            });
                        });
                    }
                    
                    if (lesson.subgroups.length === 0) {
                        const numberMatch = cell.text().match(/\((\d+)\)$/);
                        lesson.subgroups.push({
                            room: cell.find('.aud_number').text().trim(),
                            teacher: cell.find('span[title]').last().attr('title')?.trim() || '',
                            teacherShort: cell.find('span[title]').last().text().trim(),
                            subgroupNumber: numberMatch ? numberMatch[1] : null
                        });
                    }
                    schedule.push(lesson);
                }
            });
        });
        
        if (schedule.length === 0) {
            if ($('form[name="sp_student"]').length > 0 && $('.slt').length === 0) {
                console.warn('Warning: Schedule table not found. The site might have returned a selection page.');
                return res.status(404).json({ error: 'Schedule not found for these parameters. Maybe wrong group or week?' });
            }
        }
        
        res.json({ weekInfo, schedule });

    } catch (error) {
        console.error('Specific error message:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Failed to fetch or parse schedule' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});