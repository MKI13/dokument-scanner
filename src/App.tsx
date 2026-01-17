import React, { useState } from 'react';
import { Upload } from './pages/Upload';
import { AllDocuments } from './pages/AllDocuments';
import { Customers } from './pages/Customers';
import { MonthView } from './pages/MonthView';
import { Duplicates } from './pages/Duplicates';
import { Calendar } from './pages/Calendar';
import { Upload as UploadIcon, FileText, Users, Calendar as CalendarIcon, Copy, Folder } from 'lucide-react';
import './App.css';

const APP_VERSION = 'v1.5.6';

type Page = 'upload' | 'documents' | 'customers' | 'month' | 'duplicates' | 'calendar';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('upload');
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDocumentSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getPageTitle = (): string => {
    switch (currentPage) {
      case 'upload': return '📸 Dokument Scanner';
      case 'documents': return '📚 Alle Dokumente';
      case 'customers': return '👥 Kunden';
      case 'month': return '📅 Monatsansicht';
      case 'duplicates': return '🔍 Duplikate';
      case 'calendar': return '📆 Kalender';
    }
  };

  return (
    <div className="app">
      {/* HEADER - IMMER SICHTBAR */}
      <header className="app-header">
        <h1>{getPageTitle()}</h1>
        <span className="app-version">{APP_VERSION}</span>
      </header>

      {/* NAVIGATION - IMMER SICHTBAR AUF ALLEN SEITEN */}
      <nav className="top-navigation">
        <button
          className={currentPage === 'upload' ? 'active' : ''}
          onClick={() => setCurrentPage('upload')}
        >
          <UploadIcon size={20} />
          <span>Upload</span>
        </button>
        <button
          className={currentPage === 'documents' ? 'active' : ''}
          onClick={() => setCurrentPage('documents')}
        >
          <FileText size={20} />
          <span>Dokumente</span>
        </button>
        <button
          className={currentPage === 'customers' ? 'active' : ''}
          onClick={() => setCurrentPage('customers')}
        >
          <Users size={20} />
          <span>Kunden</span>
        </button>
        <button
          className={currentPage === 'month' ? 'active' : ''}
          onClick={() => setCurrentPage('month')}
        >
          <Folder size={20} />
          <span>Monat</span>
        </button>
        <button
          className={currentPage === 'calendar' ? 'active' : ''}
          onClick={() => setCurrentPage('calendar')}
        >
          <CalendarIcon size={20} />
          <span>Kalender</span>
        </button>
        <button
          className={currentPage === 'duplicates' ? 'active' : ''}
          onClick={() => setCurrentPage('duplicates')}
        >
          <Copy size={20} />
          <span>Duplikate</span>
        </button>
      </nav>

      {/* CONTENT - WECHSELT JE NACH PAGE */}
      <main className="app-main">
        {currentPage === 'upload' && (
          <Upload 
            onDocumentSaved={handleDocumentSaved}
            setSwipeEnabled={setSwipeEnabled}
          />
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
      </main>
    </div>
  );
}

export default App;
