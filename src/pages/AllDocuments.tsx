import React, { useState, useEffect } from 'react';
import { DocumentCard } from '../components/Document/DocumentCard';
import { ExportDialog } from '../components/Export/ExportDialog';
import { ImportDialog } from '../components/Import/ImportDialog';
import { documentService } from '../services/document.service';
import { modalService } from '../services/modal.service';
import { Document } from '../types/document';
import { Download, Upload, RefreshCw } from 'lucide-react';
import './AllDocuments.css';

interface AllDocumentsProps {
  setSwipeEnabled: (enabled: boolean) => void;
  refreshTrigger?: number;
}

export const AllDocuments: React.FC<AllDocumentsProps> = ({ 
  setSwipeEnabled,
  refreshTrigger = 0
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    console.log('🔄 REFRESH TRIGGER:', refreshTrigger);
    loadDocuments();
  }, [refreshTrigger]);

  useEffect(() => {
    if (showExport || showImport) {
      setSwipeEnabled(false);
    } else {
      setSwipeEnabled(true);
    }
  }, [showExport, showImport, setSwipeEnabled]);

  const loadDocuments = async () => {
    try {
      console.log('📚 LADE DOKUMENTE...');
      setLoading(true);
      const docs = await documentService.getAllDocuments();
      console.log('✅ GELADEN:', docs.length, 'Dokumente');
      setDocuments(docs);
    } catch (error) {
      console.error('❌ Fehler beim Laden:', error);
      await modalService.error('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Lade Dokumente...</p>
      </div>
    );
  }

  return (
    <div className="all-documents">
      <div className="page-header">
        <h1>Alle Dokumente</h1>
        <div className="header-actions">
          <span className="document-count">
            {documents.length} Dokument{documents.length !== 1 ? 'e' : ''}
          </span>
          <button onClick={() => setShowImport(true)} className="import-button">
            <Upload size={18} />
            <span>Import</span>
          </button>
          <button onClick={() => setShowExport(true)} className="export-button">
            <Download size={18} />
            <span>Export</span>
          </button>
          <button onClick={loadDocuments} className="refresh-button">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="documents-grid">
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            setSwipeEnabled={setSwipeEnabled}
            onUpdate={loadDocuments}
          />
        ))}
      </div>

      {documents.length === 0 && (
        <div className="no-documents">
          <p>Keine Dokumente vorhanden</p>
        </div>
      )}

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImportComplete={loadDocuments}
        />
      )}
    </div>
  );
};
