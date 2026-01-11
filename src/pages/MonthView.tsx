import React, { useState, useEffect } from 'react';
import { DocumentCard } from '../components/Document/DocumentCard';
import { ExportDialog } from '../components/Export/ExportDialog';
import { documentService } from '../services/document.service';
import { Document } from '../types/document';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import './MonthView.css';

interface MonthViewProps {
  setSwipeEnabled: (enabled: boolean) => void;
  refreshTrigger?: number;
}

export const MonthView: React.FC<MonthViewProps> = ({ 
  setSwipeEnabled, 
  refreshTrigger = 0 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (showExport) {
      setSwipeEnabled(false);
    } else {
      setSwipeEnabled(true);
    }
  }, [showExport, setSwipeEnabled]);

  useEffect(() => {
    console.log('🔄 MONTH VIEW REFRESH:', refreshTrigger);
    loadDocuments();
  }, [currentDate, refreshTrigger]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const docs = await documentService.getDocumentsByMonth(year, month);
      console.log('📅 MONTH DOCS:', docs.length);
      setDocuments(docs);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTotalAmount = () => {
    return documents.reduce((sum, doc) => sum + (doc.amount || 0), 0);
  };

  const monthName = currentDate.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Lade Dokumente...</p>
      </div>
    );
  }

  return (
    <div className="month-view">
      <div className="month-header">
        <button onClick={goToPreviousMonth} className="nav-button">
          <ChevronLeft size={24} />
        </button>

        <div className="month-info">
          <h2>{monthName}</h2>
          <p>
            {documents.length} Dokument{documents.length !== 1 ? 'e' : ''} • {getTotalAmount().toFixed(2)} € gesamt
          </p>
        </div>

        <button onClick={goToNextMonth} className="nav-button">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="month-actions">
        <button onClick={goToToday} className="action-button">
          Heute
        </button>
        <button onClick={loadDocuments} className="action-button">
          Aktualisieren
        </button>
        <button onClick={() => setShowExport(true)} className="action-button export">
          <Download size={18} />
          Exportieren
        </button>
      </div>

      <div className="documents-grid">
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            setSwipeEnabled={setSwipeEnabled}
          />
        ))}
      </div>

      {documents.length === 0 && (
        <div className="no-documents">
          <p>Keine Dokumente in diesem Monat</p>
        </div>
      )}

      {showExport && (
        <ExportDialog onClose={() => setShowExport(false)} />
      )}
    </div>
  );
};
