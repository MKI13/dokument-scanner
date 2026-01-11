import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, FileText, Calendar, Users, Copy } from 'lucide-react';
import { Upload } from './pages/Upload';
import { AllDocuments } from './pages/AllDocuments';
import { Calendar as CalendarPage } from './pages/Calendar';
import { Customers } from './pages/Customers';
import { Duplicates } from './pages/Duplicates';
import './App.css';

type Page = 'upload' | 'documents' | 'calendar' | 'customers' | 'duplicates';

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
      const pages: Page[] = ['upload', 'documents', 'calendar', 'customers', 'duplicates'];
      const currentIndex = pages.indexOf(currentPage);
      
      if (isLeftSwipe && currentIndex < pages.length - 1) {
        setCurrentPage(pages[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        setCurrentPage(pages[currentIndex - 1]);
      }
    }
  };

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return <Upload setSwipeEnabled={setSwipeEnabled} />;
      case 'documents':
        return <AllDocuments setSwipeEnabled={setSwipeEnabled} refreshTrigger={refreshTrigger} />;
      case 'calendar':
        return <CalendarPage setSwipeEnabled={setSwipeEnabled} />;
      case 'customers':
        return <Customers setSwipeEnabled={setSwipeEnabled} />;
      case 'duplicates':
        return <Duplicates setSwipeEnabled={setSwipeEnabled} />;
      default:
        return null;
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
          <UploadIcon size={24} />
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

        <button
          className={`nav-button ${currentPage === 'duplicates' ? 'active' : ''}`}
          onClick={() => setCurrentPage('duplicates')}
        >
          <Copy size={24} />
        </button>
      </nav>

      <main className="app-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
