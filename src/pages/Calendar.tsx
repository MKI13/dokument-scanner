import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/database.service';
import { stateService } from '../services/state.service';
import { Document } from '../types/document';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

interface CalendarProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ setSwipeEnabled }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // State aus localStorage laden
  const savedState = stateService.getCalendarState();
  
  const [currentMonth, setCurrentMonth] = useState(savedState.selectedMonth);
  const [currentYear, setCurrentYear] = useState(savedState.selectedYear);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [monthDocs, setMonthDocs] = useState<Map<number, Document[]>>(new Map());

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    organizeDocumentsByDay();
  }, [documents, currentMonth, currentYear]);

  // Speichere State bei Änderungen
  useEffect(() => {
    stateService.saveCalendarState({
      selectedMonth: currentMonth,
      selectedYear: currentYear
    });
  }, [currentMonth, currentYear]);

  // Speichere Scroll-Position
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        stateService.saveScrollPosition('calendar', contentRef.current.scrollTop);
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      stateService.restoreScrollPosition('calendar', element);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [documents.length]);

  const loadDocuments = async () => {
    const docs = await db.documents.toArray();
    setDocuments(docs);
  };

  const organizeDocumentsByDay = () => {
    const dayMap = new Map<number, Document[]>();

    documents.forEach(doc => {
      if (doc.date) {
        const docDate = new Date(doc.date);
        if (docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear) {
          const day = docDate.getDate();
          const existing = dayMap.get(day) || [];
          dayMap.set(day, [...existing, doc]);
        }
      }
    });

    setMonthDocs(dayMap);
  };

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getTotalAmount = (day: number): number => {
    const docs = monthDocs.get(day) || [];
    return docs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📅 Kalender</h1>
      </div>

      <div className="calendar-controls">
        <button onClick={previousMonth} className="month-nav-button">
          <ChevronLeft size={20} />
        </button>
        <h2>{monthNames[currentMonth]} {currentYear}</h2>
        <button onClick={nextMonth} className="month-nav-button">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="page-content" ref={contentRef}>
        <div className="calendar-grid">
          <div className="calendar-weekday">Mo</div>
          <div className="calendar-weekday">Di</div>
          <div className="calendar-weekday">Mi</div>
          <div className="calendar-weekday">Do</div>
          <div className="calendar-weekday">Fr</div>
          <div className="calendar-weekday">Sa</div>
          <div className="calendar-weekday">So</div>

          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="calendar-day empty" />;
            }

            const docs = monthDocs.get(day) || [];
            const totalAmount = getTotalAmount(day);
            const hasDocuments = docs.length > 0;

            return (
              <div
                key={day}
                className={`calendar-day ${hasDocuments ? 'has-documents' : ''}`}
              >
                <div className="day-number">{day}</div>
                {hasDocuments && (
                  <div className="day-info">
                    <span className="doc-count">{docs.length} 📄</span>
                    {totalAmount > 0 && (
                      <span className="doc-amount">{totalAmount.toFixed(2)} €</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Zusammenfassung */}
        <div className="month-summary">
          <h3>Monatsübersicht</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Dokumente:</span>
              <span className="summary-value">
                {Array.from(monthDocs.values()).flat().length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Gesamtsumme:</span>
              <span className="summary-value">
                {Array.from(monthDocs.values())
                  .flat()
                  .reduce((sum, doc) => sum + (doc.amount || 0), 0)
                  .toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
