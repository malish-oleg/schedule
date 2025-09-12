// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* Убираем .app-layout, так как он теперь внутри SchedulePage */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* МАРШРУТЫ ДЛЯ РАСПИСАНИЯ */}
        {/* :type будет либо 'group', либо 'teacher' */}
        <Route path="/schedule/:type/:id1/:id2/:year/:month/:day" element={<SchedulePage />} />
        <Route path="/schedule/:type/:id1/:id2" element={<ScheduleRedirector />} />
        
        {/* Редирект со старых ссылок на новый формат (если нужно) */}
        <Route path="/schedule/:facultyId/:groupId" element={<OldLinkRedirector type="group" />} />
        <Route path="/schedule/:facultyId/:groupId/:week" element={<OldLinkRedirector type="group" />} />

      </Routes>
    </BrowserRouter>
  );
}

// Универсальный редиректор на сегодняшний день
function ScheduleRedirector() {
  const { type, id1, id2 } = useParams();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return <Navigate to={`/schedule/${type}/${id1}/${id2}/${year}/${month}/${day}`} replace />;
}

// Вспомогательный редиректор для совместимости со старыми ссылками (опционально, но полезно)
function OldLinkRedirector({ type }) {
    const { facultyId, groupId } = useParams();
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return <Navigate to={`/schedule/${type}/${facultyId}/${groupId}/${year}/${month}/${day}`} replace />;
}


export default App;