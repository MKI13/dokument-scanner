import { useState } from 'react';
import Header from './components/Header';
import UploadPage from './pages/UploadPage';
import DocumentsPage from './pages/DocumentsPage';
import CustomersPage from './pages/CustomersPage';
import MonthPage from './pages/MonthPage';
import CalendarPage from './pages/CalendarPage';
import DuplicatesPage from './pages/DuplicatesPage';

export default function App() {
  const [activeView, setActiveView] = useState<'upload' | 'documents' | 'customers' | 'month' | 'calendar' | 'duplicates'>('upload');
  const [deleteMode, setDeleteMode] = useState(false);

  const handleDeleteAll = async () => {
    const { db } = await import('./db/database');
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
        {activeView === 'upload' && <UploadPage />}
        {activeView === 'documents' && <DocumentsPage deleteMode={deleteMode} />}
        {activeView === 'customers' && <CustomersPage />}
        {activeView === 'month' && <MonthPage />}
        {activeView === 'calendar' && <CalendarPage />}
        {activeView === 'duplicates' && <DuplicatesPage />}
      </main>
    </div>
  );
}
