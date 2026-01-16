import React, { useState } from 'react';
import { Upload } from './pages/Upload';
import { AllDocuments } from './pages/AllDocuments';
import { Customers } from './pages/Customers';
import { Camera as CameraIcon, FileText, Users } from 'lucide-react';
import './App.css';

const APP_VERSION = 'v1.5.2';

type Page = 'scanner' | 'all-documents' | 'customers';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('scanner');
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

    if (isLeftSwipe) {
      if (currentPage === 'scanner') setCurrentPage('all-documents');
      else if (currentPage === 'all-documents') setCurrentPage('customers');
    }

    if (isRightSwipe) {
      if (currentPage === 'customers') setCurrentPage('all-documents');
      else if (currentPage === 'all-documents') setCurrentPage('scanner');
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
      {currentPage === 'scanner' && (
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
      {currentPage === 'all-documents' && (
        <AllDocuments 
          setSwipeEnabled={setSwipeEnabled}
          refreshTrigger={refreshTrigger}
        />
      )}
      {currentPage === 'customers' && (
        <Customers setSwipeEnabled={setSwipeEnabled} />
      )}

      <nav className="bottom-nav">
        <button
          className={currentPage === 'scanner' ? 'active' : ''}
          onClick={() => setCurrentPage('scanner')}
        >
          <CameraIcon size={24} />
          <span>Scanner</span>
        </button>
        <button
          className={currentPage === 'all-documents' ? 'active' : ''}
          onClick={() => setCurrentPage('all-documents')}
        >
          <FileText size={24} />
          <span>Dokumente</span>
        </button>
        <button
          className={currentPage === 'customers' ? 'active' : ''}
          onClick={() => setCurrentPage('customers')}
        >
          <Users size={24} />
          <span>Kunden</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
