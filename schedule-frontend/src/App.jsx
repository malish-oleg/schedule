import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import { Analytics } from "@vercel/analytics/react";
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          <Route path="/schedule/:facultyId/:groupId/:week?" element={<SchedulePage />} />
        </Routes>
      </div>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;