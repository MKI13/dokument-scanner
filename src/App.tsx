import { useState } from 'react';
import Header from './components/Header';

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
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dokument Scanner v1.5.9</h2>
          <p className="text-gray-600">Ansicht: {activeView}</p>
          <p className="text-sm text-gray-500 mt-4">App läuft erfolgreich!</p>
        </div>
      </main>
    </div>
  );
}
