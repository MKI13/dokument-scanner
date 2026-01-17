import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/database.service';
import { importService } from '../services/import.service';
import { modalService } from '../services/modal.service';
import { stateService } from '../services/state.service';
import { DocumentEditor } from '../components/DocumentEditor';
import { DocumentViewer } from '../components/DocumentViewer';
import { Document } from '../types/document';
import { Trash2, Download, Upload, Search, RefreshCw, ImagePlus, ArrowUpDown, Edit2, Eye } from 'lucide-react';
import './AllDocuments.css';

interface AllDocumentsProps {
  setSwipeEnabled: (enabled: boolean) => void;
  refreshTrigger: number;
}

type SortOption = 'alphabet' | 'date' | 'upload';

const APP_VERSION = 'v1.5.6';

export const AllDocuments: React.FC<AllDocumentsProps> = ({ setSwipeEnabled, refreshTrigger }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const savedState = stateService.getAllDocumentsState();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>(savedState.sortBy);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger]);

  useEffect(() => {
    filterAndSortDocuments();
  }, [searchQuery, documents, sortBy]);

  useEffect(() => {
    stateService.saveAllDocumentsState({ sortBy, searchQuery });
  }, [sortBy, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        stateService.saveScrollPosition('all-documents', contentRef.current.scrollTop);
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      stateService.restoreScrollPosition('all-documents', element);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [loading]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await db.documents.toArray();
      setDocuments(docs);
      console.log(`✅ GELADEN: ${docs.length} Dokumente`);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      await modalService.error('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = documents;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      filtered = documents.filter(doc => {
        // Suche nach Dateiname
        if (doc.filename.toLowerCase().includes(query)) return true;
        
        // Suche nach Kunde
        if (doc.customer?.toLowerCase().includes(query)) return true;
        
        // Suche nach Betrag (z.B. "77.43" oder "77,43" oder "77")
        if (doc.amount) {
          const amountStr = doc.amount.toString();
          const amountComma = doc.amount.toFixed(2).replace('.', ',');
          if (amountStr.includes(query) || amountComma.includes(query)) return true;
        }
        
        // Suche nach Datum (verschiedene Formate)
        if (doc.date) {
          const dateObj = new Date(doc.date);
          // ISO Format: 2024-07-15
          const isoDate = dateObj.toISOString().split('T')[0];
          // DE Format: 15.07.2024
          const deDate = dateObj.toLocaleDateString('de-DE');
          // Jahr: 2024
          const year = dateObj.getFullYear().toString();
          // Monat: 07 oder 7
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          
          if (isoDate.includes(query) || 
              deDate.includes(query) || 
              year.includes(query) || 
              month.includes(query)) return true;
        }
        
        return false;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alphabet':
          return a.filename.localeCompare(b.filename);
        
        case 'date':
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        
        case 'upload':
        default:
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
    });

    setFilteredDocs(sorted);
  };

  const handleView = (doc: Document) => {
    setViewingDocument(doc);
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
  };

  const handleEditorClose = () => {
    setEditingDocument(null);
  };

  const handleViewerClose = () => {
    setViewingDocument(null);
  };

  const handleEditorSave = () => {
    loadDocuments();
  };

  const handleReplaceImage = async (doc: Document) => {
    if (!doc.id) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const newBlob = new Blob([await file.arrayBuffer()], { type: file.type });
        await db.documents.update(doc.id!, { blob: newBlob });
        await modalService.success('✅ Bild ersetzt!');
        loadDocuments();
      } catch (error) {
        console.error('Fehler beim Ersetzen:', error);
        await modalService.error('Fehler beim Bild ersetzen');
      }
    };
    
    input.click();
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
      const withImages = await modalService.confirm(
        '📦 Wie möchtest du exportieren?\n\n' +
        '✅ MIT BILDERN → JSON + ZIP (empfohlen!)\n' +
        '❌ NUR DATEN → Nur JSON (ohne Bilder)',
        'Export-Typ wählen'
      );

      if (withImages) {
        const { json, zip } = await importService.exportWithImages();
        const date = new Date().toISOString().split('T')[0];
        
        const jsonUrl = URL.createObjectURL(json);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `dokumente-backup_${date}.json`;
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);
        URL.revokeObjectURL(jsonUrl);
        
        const zipUrl = URL.createObjectURL(zip);
        const zipLink = document.createElement('a');
        zipLink.href = zipUrl;
        zipLink.download = `dokumente-bilder_${date}.zip`;
        document.body.appendChild(zipLink);
        zipLink.click();
        document.body.removeChild(zipLink);
        URL.revokeObjectURL(zipUrl);
        
        await modalService.success(
          '✅ Backup exportiert!\n\n' +
          '2 Dateien heruntergeladen:\n' +
          '📄 JSON (Metadaten)\n' +
          '📷 ZIP (Bilder)'
        );
      } else {
        const jsonString = await importService.exportToJSON();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dokumente-backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        await modalService.success('✅ JSON exportiert (ohne Bilder)');
      }
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

      const hasZip = await modalService.confirm(
        '📦 Hast du auch ein ZIP-Archiv mit den Bildern?\n\n' +
        '✅ JA → Wähle ZIP-Datei mit Fotos\n' +
        '❌ NEIN → Nur JSON (Platzhalter-Bilder)',
        'Bilder-Archiv vorhanden?'
      );

      if (hasZip) {
        const zipInput = document.createElement('input');
        zipInput.type = 'file';
        zipInput.accept = '.zip';
        
        zipInput.onchange = async (ze: any) => {
          const zipFile = ze.target.files?.[0];
          await performImport(jsonFile, zipFile);
        };
        
        zipInput.click();
      } else {
        await performImport(jsonFile);
      }
    };
    
    input.click();
  };

  const performImport = async (jsonFile: File, zipFile?: File) => {
    try {
      const result = await importService.importFromBackup(jsonFile, zipFile);
      
      await modalService.success(
        `✅ Import abgeschlossen!\n\n` +
        `Erfolgreich: ${result.success}\n` +
        `Fehler: ${result.errors}\n\n` +
        `${zipFile ? '📷 Bilder aus ZIP geladen' : '🖼️ Platzhalter erstellt'}`
      );
      
      loadDocuments();
    } catch (error: any) {
      console.error('Import-Fehler:', error);
      await modalService.error(`Import fehlgeschlagen:\n\n${error.message}`);
    }
  };

  const isPlaceholder = (doc: Document): boolean => {
    return doc.blob?.type === 'image/svg+xml';
  };

  const getSortLabel = (): string => {
    switch (sortBy) {
      case 'alphabet': return 'A-Z';
      case 'date': return 'Rechnungsdatum';
      case 'upload': return 'Upload-Datum';
    }
  };

  const cycleSortOption = () => {
    const options: SortOption[] = ['upload', 'date', 'alphabet'];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
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
        <div className="header-actions">
          <button 
            onClick={loadDocuments} 
            className="icon-button refresh" 
            title="Aktualisieren"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleImport} 
            className="icon-button import" 
            title="Import"
          >
            <Upload size={20} />
          </button>
          <button 
            onClick={handleExport} 
            className="icon-button export" 
            title="Export"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Suche: Dateiname, Kunde, Datum, Betrag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="stats-bar">
        <span>
          {filteredDocs.length === documents.length 
            ? `${documents.length} Dokumente` 
            : `${filteredDocs.length} von ${documents.length} Dokumenten`
          }
        </span>
        <button 
          onClick={cycleSortOption}
          className="sort-button"
          title="Sortierung ändern"
        >
          <ArrowUpDown size={16} />
          <span>{getSortLabel()}</span>
        </button>
      </div>

      <div className="page-content" ref={contentRef}>
        {filteredDocs.length > 0 ? (
          <div className="documents-grid">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-preview">
                  <img 
                    src={URL.createObjectURL(doc.blob)} 
                    alt={doc.filename}
                  />
                  
                  {isPlaceholder(doc) && doc.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReplaceImage(doc);
                      }}
                      className="replace-image-button"
                      title="Bild hochladen"
                    >
                      <ImagePlus size={20} />
                      <span>Bild hochladen</span>
                    </button>
                  )}
                </div>
                
                <div className="document-info">
                  <h3>{doc.filename}</h3>
                  {doc.customer && <p>👤 {doc.customer}</p>}
                  {doc.amount && <p>💰 {doc.amount.toFixed(2)} EUR</p>}
                  {doc.date && (
                    <p>📅 {new Date(doc.date).toLocaleDateString('de-DE')}</p>
                  )}
                </div>
                
                <div className="document-actions-left">
                  {doc.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc);
                      }}
                      className="delete-button"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="document-actions-right">
                  {doc.id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(doc);
                        }}
                        className="view-button"
                        title="Ansehen"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(doc);
                        }}
                        className="edit-button"
                        title="Bearbeiten"
                      >
                        <Edit2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-documents">
            <p>
              {searchQuery ? 'Keine Dokumente gefunden' : 'Noch keine Dokumente vorhanden'}
            </p>
          </div>
        )}
      </div>

      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={handleViewerClose}
          setSwipeEnabled={setSwipeEnabled}
        />
      )}

      {editingDocument && (
        <DocumentEditor
          document={editingDocument}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
          setSwipeEnabled={setSwipeEnabled}
        />
      )}
    </div>
  );
};
