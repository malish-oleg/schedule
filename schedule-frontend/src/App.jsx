// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* Убираем .app-layout и .main-content отсюда */}
      <Routes>
        {/* HomePage будет без основного макета, это нормально */}
        <Route path="/" element={<HomePage />} /> 
        
        {/* А вот SchedulePage будет рендерить весь макет */}
        <Route path="/schedule/:facultyId/:groupId/:year/:month/:day" element={<SchedulePage />} />
        <Route path="/schedule/:facultyId/:groupId" element={<ScheduleRedirector />} />
      </Routes>
    </BrowserRouter>
  );
}

function ScheduleRedirector() {
  const { facultyId, groupId } = useParams();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return <Navigate to={`/schedule/${facultyId}/${groupId}/${year}/${month}/${day}`} replace />;
}

export default App;