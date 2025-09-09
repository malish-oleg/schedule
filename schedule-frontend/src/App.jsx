import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              
              <Route path="/schedule/:facultyId/:groupId/:week?" element={<SchedulePage />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
      <Analytics />
      < SpeedInsights />
    </BrowserRouter>
  );
}

export default App;