import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import ScheduleRedirector from './pages/ScheduleRedirector';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/schedule/:facultyId/:groupId" element={<ScheduleRedirector />} />
          
          <Route path="/schedule/:facultyId/:groupId/:week" element={<SchedulePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;