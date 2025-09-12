import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import { Analytics } from "@vercel/analytics/react";
import Footer from './components/Footer';
import UpdateModal from './components/UpdateModal';
import './App.css';

const UPDATE_MODAL_STORAGE_KEY = 'updateModalDismissed-v1';

function App() {

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    // Проверяем, была ли отметка в localStorage
    const hasDismissed = localStorage.getItem(UPDATE_MODAL_STORAGE_KEY);
    
    // Если отметки нет, показываем окно
    if (!hasDismissed) {
      setShowUpdateModal(true);
    }
  }, []);

  const handleCloseUpdateModal = () => {
    // При закрытии ставим отметку в localStorage
    localStorage.setItem(UPDATE_MODAL_STORAGE_KEY, 'true');
    setShowUpdateModal(false);
  };


  return (
    <BrowserRouter>
      {showUpdateModal && <UpdateModal on_Close={handleCloseUpdateModal} />}
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
    </BrowserRouter>
  );
}

export default App;