import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { Document } from '../types/document';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

const APP_VERSION = 'v1.5.6';

interface CalendarProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ setSwipeEnabled }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [currentDate]);

  const loadDocuments = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const allDocs = await db.documents.toArray();
    const monthDocs = allDocs.filter(doc => {
      if (!doc.date) return false;
      const docDate = new Date(doc.date);
      return docDate >= startDate && docDate <= endDate;
    });
    
    setDocuments(monthDocs);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    const startPadding = (firstDay.getDay() + 6) % 7;
    
    for (let i = 0; i < startPadding; i++) {
      days.push(new Date(year, month, -startPadding + i + 1));
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getDocumentsForDate = (date: Date) => {
    return documents.filter(doc => {
      if (!doc.date) return false;
      const docDate = new Date(doc.date);
      return docDate.toDateString() === date.toDateString();
    });
  };

  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>📆 Kalender</h1>
          <span className="app-version">{APP_VERSION}</span>
        </div>
      </div>

      <div className="calendar-navigation">
        <button onClick={previousMonth}>
          <ChevronLeft size={24} />
        </button>
        <h2>{monthName}</h2>
        <button onClick={nextMonth}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="calendar-grid">
        <div className="weekday-header">Mo</div>
        <div className="weekday-header">Di</div>
        <div className="weekday-header">Mi</div>
        <div className="weekday-header">Do</div>
        <div className="weekday-header">Fr</div>
        <div className="weekday-header">Sa</div>
        <div className="weekday-header">So</div>

        {days.map((day, index) => {
          const docsForDay = getDocumentsForDate(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${docsForDay.length > 0 ? 'has-documents' : ''}`}
              onClick={() => docsForDay.length > 0 && setSelectedDate(day)}
            >
              <span className="day-number">{day.getDate()}</span>
              {docsForDay.length > 0 && (
                <span className="doc-count">{docsForDay.length}</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="selected-date-docs">
          <h3>{selectedDate.toLocaleDateString('de-DE')}</h3>
          <div className="documents-list">
            {getDocumentsForDate(selectedDate).map(doc => (
              <div key={doc.id} className="doc-item">
                <img src={URL.createObjectURL(doc.blob)} alt={doc.filename} />
                <div>
                  <p>{doc.filename}</p>
                  {doc.customer && <p>👤 {doc.customer}</p>}
                  {doc.amount && <p>💰 {doc.amount.toFixed(2)} EUR</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
