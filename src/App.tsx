import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';
import Header from './components/Header';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import CustomerView from './components/CustomerView';
import MonthView from './components/MonthView';
import CalendarView from './components/CalendarView';
import DuplicateView from './components/DuplicateView';
import BackupManager from './components/BackupManager';

export default function App() {
  const [activeView, setActiveView] = useState<'upload' | 'documents' | 'customers' | 'month' | 'calendar' | 'duplicates'>('upload');
  const [deleteMode, setDeleteMode] = useState(false);

  const documents = useLiveQuery(() => db.documents.toArray()) || [];

  const handleDeleteAll = async () => {
    await db.documents.clear();
    setDeleteMode(false);
  };

  const handleToggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeView={activeView}
        onViewChange={setActiveView}
        onDeleteAll={handleDeleteAll}
        deleteMode={deleteMode}
        onToggleDeleteMode={handleToggleDeleteMode}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeView === 'upload' && (
          <div className="space-y-6">
            <DocumentUpload />
            <BackupManager />
          </div>
        )}
        {activeView === 'documents' && <DocumentList deleteMode={deleteMode} />}
        {activeView === 'customers' && <CustomerView />}
        {activeView === 'month' && <MonthView />}
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'duplicates' && <DuplicateView />}
      </main>
    </div>
  );
}
