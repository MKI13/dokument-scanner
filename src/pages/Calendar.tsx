import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { Document } from '../types/document';
import { DocumentCard } from '../components/Document/DocumentCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

interface CalendarProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ setSwipeEnabled }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [currentDate]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const allDocs = await db.documents.toArray();
      
      // Filter für aktuellen Monat
      const filtered = allDocs.filter(doc => {
        const docDate = new Date(doc.documentDate);
        return (
          docDate.getMonth() === currentDate.getMonth() &&
          docDate.getFullYear() === currentDate.getFullYear()
        );
      });
      
      setDocuments(filtered);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Mo = 0
  };

  const getDocumentsForDate = (day: number) => {
    return documents.filter(doc => {
      const docDate = new Date(doc.documentDate);
      return (
        docDate.getDate() === day &&
        docDate.getMonth() === currentDate.getMonth() &&
        docDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
  };

  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const selectedDayDocs = selectedDate 
    ? getDocumentsForDate(selectedDate.getDate())
    : [];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Lade Kalender...</p>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <button onClick={previousMonth} className="calendar-nav-btn">
          <ChevronLeft size={24} />
        </button>
        <h2>{monthName}</h2>
        <button onClick={nextMonth} className="calendar-nav-btn">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="calendar-grid">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const docsForDay = getDocumentsForDate(day);
          const isSelected = selectedDate?.getDate() === day;
          const isToday = 
            new Date().getDate() === day &&
            new Date().getMonth() === currentDate.getMonth() &&
            new Date().getFullYear() === currentDate.getFullYear();

          return (
            <div
              key={day}
              className={`calendar-day ${docsForDay.length > 0 ? 'has-docs' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <span className="calendar-day-number">{day}</span>
              {docsForDay.length > 0 && (
                <span className="calendar-day-badge">{docsForDay.length}</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && selectedDayDocs.length > 0 && (
        <div className="calendar-documents">
          <h3>
            📄 {selectedDayDocs.length} Dokument{selectedDayDocs.length !== 1 ? 'e' : ''} am{' '}
            {selectedDate.toLocaleDateString('de-DE')}
          </h3>
          <div className="documents-grid">
            {selectedDayDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                setSwipeEnabled={setSwipeEnabled}
                onUpdate={loadDocuments}
              />
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedDayDocs.length === 0 && (
        <div className="calendar-no-docs">
          <p>Keine Dokumente am {selectedDate.toLocaleDateString('de-DE')}</p>
        </div>
      )}
    </div>
  );
};
