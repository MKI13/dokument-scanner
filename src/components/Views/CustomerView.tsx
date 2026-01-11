import React, { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Document } from '../../types';
import { dbService } from '../../services/database.service';
import { DocumentCard } from '../Document/DocumentCard';

interface CustomerViewProps {
  onDocumentView: (doc: Document) => void;
  onDocumentEdit: (doc: Document) => void;
  onDocumentDelete: (doc: Document) => void;
  onDocumentDownload: (doc: Document) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  onDocumentView,
  onDocumentEdit,
  onDocumentDelete,
  onDocumentDownload
}) => {
  const [documentsByCustomer, setDocumentsByCustomer] = useState<Map<string, Document[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [collapsedCustomers, setCollapsedCustomers] = useState<Set<string>>(new Set());
  const [lastUploadedIds, setLastUploadedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await dbService.getDocumentsByCustomer();
      setDocumentsByCustomer(docs);
      
      // STANDARD: ALLE Kunden zugeklappt
      const allCustomers = new Set(docs.keys());
      setCollapsedCustomers(allCustomers);
      
      // Markiere neueste Dokumente (letzte 5)
      const allDocs = Array.from(docs.values()).flat();
      const sortedByUpload = allDocs.sort((a, b) => 
        b.uploadDate.getTime() - a.uploadDate.getTime()
      );
      const recentIds = new Set(sortedByUpload.slice(0, 5).map(d => d.id));
      setLastUploadedIds(recentIds);
      
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomer = (customer: string) => {
    setCollapsedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customer)) {
        newSet.delete(customer);
      } else {
        newSet.add(customer);
      }
      return newSet;
    });
  };

  if (loading) {
    return <div className="loading">Lädt Dokumente...</div>;
  }

  if (documentsByCustomer.size === 0) {
    return (
      <div className="empty-state">
        <Users size={64} />
        <h3>Keine Dokumente</h3>
        <p>Laden Sie Dokumente hoch, um sie hier zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="customer-view">
      {Array.from(documentsByCustomer.entries()).map(([customer, docs]) => {
        const isCollapsed = collapsedCustomers.has(customer);
        
        return (
          <div key={customer} className="customer-group">
            <div 
              className="customer-header clickable" 
              onClick={() => toggleCustomer(customer)}
            >
              <div className="customer-title-wrapper">
                <Users size={24} />
                <h2>{customer}</h2>
                <span className="document-count">{docs.length} Dokument(e)</span>
              </div>
              <button className="collapse-button">
                {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
              </button>
            </div>

            {!isCollapsed && (
              <div className="document-grid">
                {docs.map(doc => (
                  <div key={doc.id} className={lastUploadedIds.has(doc.id) ? 'recently-uploaded' : ''}>
                    <DocumentCard
                      document={doc}
                      onView={onDocumentView}
                      onEdit={onDocumentEdit}
                      onDelete={onDocumentDelete}
                      onDownload={onDocumentDownload}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
