import { useState } from 'react';
import Header from './components/Header';
import { Upload } from './pages/Upload';
import { AllDocuments } from './pages/AllDocuments';
import { Customers } from './pages/Customers';
import { MonthView } from './pages/MonthView';
import { Calendar } from './pages/Calendar';
import { Duplicates } from './pages/Duplicates';
import { Modal } from './components/Modal/Modal';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState<'upload' | 'documents' | 'customers' | 'month' | 'calendar' | 'duplicates'>('upload');
  const [deleteMode, setDeleteMode] = useState(false);

  const handleDeleteAll = async () => {
    if (window.confirm('Möchten Sie wirklich ALLE Dokumente löschen?')) {
      const { db } = await import('./db/database');
      await db.documents.clear();
      alert('Alle Dokumente wurden gelöscht!');
    }
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
        {activeView === 'upload' && <Upload />}
        {activeView === 'documents' && <AllDocuments deleteMode={deleteMode} />}
        {activeView === 'customers' && <Customers />}
        {activeView === 'month' && <MonthView />}
        {activeView === 'calendar' && <Calendar />}
        {activeView === 'duplicates' && <Duplicates />}
      </main>

      <Modal />
    </div>
  );
}
