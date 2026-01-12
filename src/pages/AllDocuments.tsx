import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { importService } from '../services/import.service';
import { modalService } from '../services/modal.service';
import { Document } from '../types/document';
import { Trash2, Download, Upload, Search, RefreshCw } from 'lucide-react';
import './AllDocuments.css';

interface AllDocumentsProps {
  setSwipeEnabled: (enabled: boolean) => void;
  refreshTrigger: number;
}

export const AllDocuments: React.FC<AllDocumentsProps> = ({ setSwipeEnabled, refreshTrigger }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger]);

  useEffect(() => {
    filterDocuments();
  }, [searchQuery, documents]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await db.documents.toArray();
      const sorted = docs.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
      setDocuments(sorted);
      console.log(`✅ GELADEN: ${sorted.length} Dokumente`);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      await modalService.error('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    if (!searchQuery.trim()) {
      setFilteredDocs(documents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = documents.filter(doc =>
      doc.filename.toLowerCase().includes(query) ||
      doc.customer?.toLowerCase().includes(query) ||
      doc.ocrText?.toLowerCase().includes(query)
    );
    setFilteredDocs(filtered);
  };

  const handleDelete = async (doc: Document) => {
    const confirmed = await modalService.confirm(
      `"${doc.filename}" wirklich löschen?`,
      'Dokument löschen'
    );

    if (!confirmed || !doc.id) return;

    try {
      await db.documents.delete(doc.id);
      await modalService.success('Dokument gelöscht!');
      loadDocuments();
    } catch (error) {
      console.error('Fehler:', error);
      await modalService.error('Fehler beim Löschen');
    }
  };

  const handleExport = async () => {
    try {
      const jsonString = await importService.exportToJSON();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await modalService.success('Backup exportiert!');
    } catch (error) {
      console.error('Export-Fehler:', error);
      await modalService.error('Export fehlgeschlagen');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = false;
    
    input.onchange = async (e: any) => {
      const jsonFile = e.target.files?.[0];
      if (!jsonFile) return;

      // Frage nach ZIP-Datei
      const hasZip = await modalService.confirm(
        'Hast du auch ein ZIP-Archiv mit den Bildern?\n\n' +
        'Wähle "Bestätigen" um ZIP auszuwählen\n' +
        'oder "Abbrechen" für nur JSON (Platzhalter-Bilder)',
        '📦 Bilder-Archiv vorhanden?'
      );

      if (hasZip) {
        // Zweiter File-Input für ZIP
        const zipInput = document.createElement('input');
        zipInput.type = 'file';
        zipInput.accept = '.zip';
        
        zipInput.onchange = async (ze: any) => {
          const zipFile = ze.target.files?.[0];
          await performImport(jsonFile, zipFile);
        };
        
        zipInput.click();
      } else {
        // Nur JSON
        await performImport(jsonFile);
      }
    };
    
    input.click();
  };

  const performImport = async (jsonFile: File, zipFile?: File) => {
    try {
      console.log('🔄 IMPORT GESTARTET');
      console.log('JSON:', jsonFile.name);
      console.log('ZIP:', zipFile?.name || 'keine');
      
      const result = await importService.importFromBackup(jsonFile, zipFile);
      
      await modalService.success(
        `✅ Import abgeschlossen!\n\n` +
        `Erfolgreich: ${result.success}\n` +
        `Fehler: ${result.errors}`
      );
      
      loadDocuments();
      
    } catch (error: any) {
      console.error('Import-Fehler:', error);
      await modalService.error(`Import fehlgeschlagen:\n${error.message}`);
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
    <div className="page-container">
      <div className="page-header">
        <h1>📚 Alle Dokumente</h1>
        <div className="header-actions">
          <button onClick={loadDocuments} className="icon-button" title="Neu laden">
            <RefreshCw size={20} />
          </button>
          <button onClick={handleImport} className="icon-button" title="Import">
            <Upload size={20} />
          </button>
          <button onClick={handleExport} className="icon-button" title="Export">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Suche nach Dateiname, Kunde oder Text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="stats-bar">
        <span>{filteredDocs.length} von {documents.length} Dokumenten</span>
      </div>

      <div className="page-content">
        {filteredDocs.length > 0 ? (
          <div className="documents-grid">
            {filteredDocs.map((doc) => (
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
                {doc.id && (
                  <button
                    onClick={() => handleDelete(doc)}
                    className="delete-button"
                    title="Löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-documents">
            <p>Keine Dokumente gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
};
