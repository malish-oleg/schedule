import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWeekNumber } from '../utils/dateUtils';
import axios from 'axios';

function HomePage() {
  const [faculties, setFaculties] = useState([]);
  const [groups, setGroups] = useState({});
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/faculties`);
        setFaculties(res.data);
      } catch (error) {
        console.error("Failed to load faculties", error);
      }
    };
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (!selectedFaculty) {
      setGroups({});
      setSelectedGroup('');
      return;
    }
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${selectedFaculty}`);
        const grouped = res.data.reduce((acc, group) => {
          (acc[group.course] = acc[group.course] || []).push(group);
          return acc;
        }, {});
        setGroups(grouped);
      } catch (error) {
        console.error("Failed to load groups", error);
        setGroups({ 'error': [] });
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [selectedFaculty]);

  const handleShowSchedule = () => {
    if (selectedFaculty && selectedGroup) {
      const currentWeek = getWeekNumber(new Date());
      navigate(`/schedule/${selectedFaculty}/${selectedGroup}`);
    }
  };

  return (
    <div className="form-container">
      <h1>Просмотр расписания</h1>
      <div className="select-wrapper">
        <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
          <option value="">Выберите направление</option>
          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      
      <div className="select-wrapper">
        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} disabled={!selectedFaculty || loading}>
          <option value="">{loading ? 'Загрузка...' : 'Выберите группу'}</option>
          {Object.keys(groups).length > 0 && Object.keys(groups)[0] !== 'error' ? (
            Object.keys(groups).map(course => (
              <optgroup key={course} label={course}>
                {groups[course].map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </optgroup>
            ))
          ) : ( selectedFaculty && <option disabled>Нет данных</option> )}
        </select>
      </div>

      <button onClick={handleShowSchedule} disabled={!selectedGroup}>
        Посмотреть расписание
      </button>
    </div>
  );
}
export default HomePage;
