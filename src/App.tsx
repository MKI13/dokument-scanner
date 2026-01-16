import React, { useState } from 'react';
import { Upload } from './pages/Upload';
import { AllDocuments } from './pages/AllDocuments';
import { Customers } from './pages/Customers';
import { MonthView } from './pages/MonthView';
import { Duplicates } from './pages/Duplicates';
import { Calendar } from './pages/Calendar';
import { Upload as UploadIcon, FileText, Users, Calendar as CalendarIcon, Copy, Folder } from 'lucide-react';
import './App.css';

const APP_VERSION = 'v1.5.2';

type Page = 'upload' | 'documents' | 'customers' | 'month' | 'duplicates' | 'calendar';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('upload');
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    if (!swipeEnabled) return;
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const pages: Page[] = ['upload', 'documents', 'customers', 'month', 'duplicates', 'calendar'];
    const currentIndex = pages.indexOf(currentPage);

    if (isLeftSwipe && currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1]);
    }

    if (isRightSwipe && currentIndex > 0) {
      setCurrentPage(pages[currentIndex - 1]);
    }
  };

  const handleDocumentSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div 
      className="app"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {currentPage === 'upload' && (
        <div className="page-wrapper">
          <div className="page-header-scanner">
            <div className="header-title">
              <h1>📸 Dokument Scanner</h1>
              <span className="app-version">{APP_VERSION}</span>
            </div>
          </div>
          <Upload 
            onDocumentSaved={handleDocumentSaved}
            setSwipeEnabled={setSwipeEnabled}
          />
        </div>
      )}

      {currentPage === 'documents' && (
        <AllDocuments 
          setSwipeEnabled={setSwipeEnabled}
          refreshTrigger={refreshTrigger}
        />
      )}

      {currentPage === 'customers' && (
        <Customers setSwipeEnabled={setSwipeEnabled} />
      )}

      {currentPage === 'month' && (
        <MonthView setSwipeEnabled={setSwipeEnabled} />
      )}

      {currentPage === 'duplicates' && (
        <Duplicates setSwipeEnabled={setSwipeEnabled} />
      )}

      {currentPage === 'calendar' && (
        <Calendar setSwipeEnabled={setSwipeEnabled} />
      )}

      <nav className="bottom-nav">
        <button
          className={currentPage === 'upload' ? 'active' : ''}
          onClick={() => setCurrentPage('upload')}
          title="Scanner"
        >
          <UploadIcon size={20} />
          <span>Scanner</span>
        </button>
        <button
          className={currentPage === 'documents' ? 'active' : ''}
          onClick={() => setCurrentPage('documents')}
          title="Alle Dokumente"
        >
          <FileText size={20} />
          <span>Dokumente</span>
        </button>
        <button
          className={currentPage === 'customers' ? 'active' : ''}
          onClick={() => setCurrentPage('customers')}
          title="Kunden"
        >
          <Users size={20} />
          <span>Kunden</span>
        </button>
        <button
          className={currentPage === 'month' ? 'active' : ''}
          onClick={() => setCurrentPage('month')}
          title="Monat"
        >
          <Folder size={20} />
          <span>Monat</span>
        </button>
        <button
          className={currentPage === 'duplicates' ? 'active' : ''}
          onClick={() => setCurrentPage('duplicates')}
          title="Duplikate"
        >
          <Copy size={20} />
          <span>Duplikate</span>
        </button>
        <button
          className={currentPage === 'calendar' ? 'active' : ''}
          onClick={() => setCurrentPage('calendar')}
          title="Kalender"
        >
          <CalendarIcon size={20} />
          <span>Kalender</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
