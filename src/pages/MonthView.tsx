import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { Document } from '../types/document';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MonthView.css';

const APP_VERSION = 'v1.5.6';

interface MonthViewProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ setSwipeEnabled }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    loadMonthDocuments();
  }, [currentDate]);

  const loadMonthDocuments = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const allDocs = await db.documents.toArray();
    const monthDocs = allDocs.filter(doc => {
      if (!doc.date) return false;
      const docDate = new Date(doc.date);
      return docDate >= startDate && docDate <= endDate;
    });
    
    setDocuments(monthDocs);
    
    const total = monthDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    setMonthlyTotal(total);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>📅 Monatsansicht</h1>
          <span className="app-version">{APP_VERSION}</span>
        </div>
      </div>

      <div className="month-navigation">
        <button onClick={previousMonth}>
          <ChevronLeft size={24} />
        </button>
        <h2>{monthName}</h2>
        <button onClick={nextMonth}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="month-stats">
        <div className="stat-card">
          <span className="stat-label">Dokumente</span>
          <span className="stat-value">{documents.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gesamtsumme</span>
          <span className="stat-value">{monthlyTotal.toFixed(2)} EUR</span>
        </div>
      </div>

      <div className="page-content">
        {documents.length > 0 ? (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-preview">
                  <img src={URL.createObjectURL(doc.blob)} alt={doc.filename} />
                </div>
                <div className="document-info">
                  <h3>{doc.filename}</h3>
                  {doc.customer && <p>👤 {doc.customer}</p>}
                  {doc.amount && <p>💰 {doc.amount.toFixed(2)} EUR</p>}
                  {doc.date && (
                    <p>📅 {new Date(doc.date).toLocaleDateString('de-DE')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-documents">
            <p>Keine Dokumente in diesem Monat</p>
          </div>
        )}
      </div>
    </div>
  );
};
