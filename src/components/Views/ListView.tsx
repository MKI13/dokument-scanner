import React, { useEffect, useState } from 'react';
import { List, Search } from 'lucide-react';
import { Document } from '../../types';
import { dbService } from '../../services/database.service';
import { DocumentCard } from '../Document/DocumentCard';

interface ListViewProps {
  onDocumentView: (doc: Document) => void;
  onDocumentEdit: (doc: Document) => void;
  onDocumentDelete: (doc: Document) => void;
  onDocumentDownload: (doc: Document) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  onDocumentView,
  onDocumentEdit,
  onDocumentDelete,
  onDocumentDownload
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'filename' | 'amount'>('date');
  
  useEffect(() => {
    loadDocuments();
  }, []);
  
  useEffect(() => {
    filterAndSort();
  }, [documents, searchQuery, sortBy]);
  
  const loadDocuments = async () => {
    try {
      const docs = await dbService.getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterAndSort = () => {
    let filtered = documents;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = documents.filter(doc =>
        doc.filename.toLowerCase().includes(query) ||
        doc.customer?.toLowerCase().includes(query) ||
        doc.extractedText.toLowerCase().includes(query) ||
        doc.notes.toLowerCase().includes(query)
      );
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const dateA = a.documentDate || a.uploadDate;
          const dateB = b.documentDate || b.uploadDate;
          return dateB.getTime() - dateA.getTime();
        case 'customer':
          return (a.customer || 'ZZZ').localeCompare(b.customer || 'ZZZ');
        case 'amount':
          const amountA = a.amount || 0;
          const amountB = b.amount || 0;
          return amountB - amountA;
        case 'filename':
          return a.filename.localeCompare(b.filename);
        default:
          return 0;
      }
    });
    
    setFilteredDocuments(filtered);
  };
  
  if (loading) {
    return <div className="loading">Lädt Dokumente...</div>;
  }
  
  return (
    <div className="list-view">
      <div className="list-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Suche nach Dokument, Kunde, Text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="sort-controls">
          <label>Sortieren:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="date">Datum</option>
            <option value="customer">Kunde</option>
            <option value="amount">Brutto-Betrag</option>
            <option value="filename">Dateiname</option>
          </select>
        </div>
        
        <div className="stats">
          <List size={20} />
          <span>{filteredDocuments.length} von {documents.length} Dokument(en)</span>
        </div>
      </div>
      
      {filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <List size={64} />
          <h3>Keine Dokumente gefunden</h3>
          <p>
            {searchQuery 
              ? 'Versuchen Sie eine andere Suche.'
              : 'Laden Sie Dokumente hoch, um sie hier zu sehen.'}
          </p>
        </div>
      ) : (
        <div className="document-grid">
          {filteredDocuments.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={onDocumentView}
              onEdit={onDocumentEdit}
              onDelete={onDocumentDelete}
              onDownload={onDocumentDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
};
