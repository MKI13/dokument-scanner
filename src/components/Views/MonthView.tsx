import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/database.service';
import { DocumentCard } from '../Document/DocumentCard';
import { ExportDialog } from '../Export/ExportDialog';

export const MonthView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  const documents = useLiveQuery(
    () => db.documents
      .where('[year+month]')
      .equals([year, month])
      .reverse()
      .sortBy('documentDate'),
    [year, month]
  );
  
  const totalAmount = documents?.reduce((sum, doc) => sum + (doc.amount || 0), 0) || 0;
  
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleRefresh = async () => {
    // Trigger re-query
    setCurrentDate(new Date(currentDate));
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {monthNames[month - 1]} {year}
            </h2>
            <p className="text-sm text-gray-600">
              {documents?.length || 0} Dokumente
            </p>
            <p className="text-sm font-medium text-blue-600">
              {totalAmount.toFixed(2)} € gesamt
            </p>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <button
          onClick={goToToday}
          className="w-full py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Heute
        </button>
        
        <button
          onClick={handleRefresh}
          className="w-full py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Aktualisieren
        </button>
        
        <button
          onClick={() => setShowExportDialog(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Exportieren
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {documents?.map(doc => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
        
        {documents?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Keine Dokumente in diesem Monat</p>
          </div>
        )}
      </div>
      
      {showExportDialog && (
        <ExportDialog
          onClose={() => setShowExportDialog(false)}
          selectedYear={year}
          selectedMonth={month}
        />
      )}
    </div>
  );
};
