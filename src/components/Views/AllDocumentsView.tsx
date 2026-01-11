import React, { useState } from 'react';
import { Download, Search, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/database.service';
import { DocumentCard } from '../Document/DocumentCard';
import { ExportDialog } from '../Export/ExportDialog';

export const AllDocumentsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const documents = useLiveQuery(
    () => db.documents.orderBy('documentDate').reverse().toArray()
  );
  
  const filteredDocuments = documents?.filter(doc => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      doc.filename?.toLowerCase().includes(search) ||
      doc.customer?.toLowerCase().includes(search) ||
      doc.extractedText?.toLowerCase().includes(search)
    );
  });
  
  const totalAmount = filteredDocuments?.reduce((sum, doc) => sum + (doc.amount || 0), 0) || 0;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Alle Dokumente</h2>
              <p className="text-sm text-gray-600">
                {filteredDocuments?.length || 0} Dokumente
              </p>
              <p className="text-sm font-medium text-blue-600">
                {totalAmount.toFixed(2)} € gesamt
              </p>
            </div>
            
            <button
              onClick={() => setShowExportDialog(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Dokumente durchsuchen..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {filteredDocuments?.map(doc => (
          <DocumentCard 
            key={doc.id} 
            document={doc}
            showActions={true}
          />
        ))}
        
        {filteredDocuments?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>
              {searchTerm 
                ? `Keine Dokumente gefunden für "${searchTerm}"`
                : 'Noch keine Dokumente vorhanden'
              }
            </p>
          </div>
        )}
      </div>
      
      {showExportDialog && (
        <ExportDialog
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
};
