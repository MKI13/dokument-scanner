import React, { useState, useEffect } from 'react';
import { Upload, FileText, Calendar, Users } from 'lucide-react';
import { AllDocuments } from './pages/AllDocuments';
import './App.css';

type Page = 'upload' | 'documents' | 'calendar' | 'customers';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('upload');
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!swipeEnabled) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipeEnabled) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!swipeEnabled || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const pages: Page[] = ['upload', 'documents', 'calendar', 'customers'];
      const currentIndex = pages.indexOf(currentPage);
      
      if (isLeftSwipe && currentIndex < pages.length - 1) {
        setCurrentPage(pages[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        setCurrentPage(pages[currentIndex - 1]);
      }
    }
  };

  return (
    <div 
      className="app"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <header className="app-header">
        <div className="app-icon">📄</div>
        <h1>Dokument Scanner</h1>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${currentPage === 'upload' ? 'active' : ''}`}
          onClick={() => setCurrentPage('upload')}
        >
          <Upload size={24} />
        </button>

        <button
          className={`nav-button ${currentPage === 'documents' ? 'active' : ''}`}
          onClick={() => setCurrentPage('documents')}
        >
          <FileText size={24} />
        </button>

        <button
          className={`nav-button ${currentPage === 'calendar' ? 'active' : ''}`}
          onClick={() => setCurrentPage('calendar')}
        >
          <Calendar size={24} />
        </button>

        <button
          className={`nav-button ${currentPage === 'customers' ? 'active' : ''}`}
          onClick={() => setCurrentPage('customers')}
        >
          <Users size={24} />
        </button>
      </nav>

      <main className="app-content">
        {currentPage === 'upload' && (
          <div className="placeholder-page">
            <Upload size={64} />
            <h2>Upload</h2>
            <p>Wird geladen...</p>
          </div>
        )}

        {currentPage === 'documents' && (
          <AllDocuments 
            setSwipeEnabled={setSwipeEnabled}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentPage === 'calendar' && (
          <div className="placeholder-page">
            <Calendar size={64} />
            <h2>Kalender</h2>
            <p>Kommt bald...</p>
          </div>
        )}

        {currentPage === 'customers' && (
          <div className="placeholder-page">
            <Users size={64} />
            <h2>Kunden</h2>
            <p>Kommt bald...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
