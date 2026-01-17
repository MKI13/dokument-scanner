import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { modalService } from '../services/modal.service';
import { Document } from '../types/document';
import { Trash2, Eye } from 'lucide-react';
import './Duplicates.css';

const APP_VERSION = 'v1.5.6';

interface DuplicatesProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

interface DuplicateGroup {
  filename: string;
  documents: Document[];
}

export const Duplicates: React.FC<DuplicatesProps> = ({ setSwipeEnabled }) => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const docs = await db.documents.toArray();
      
      const filenameMap = new Map<string, Document[]>();
      
      docs.forEach(doc => {
        const filename = doc.filename.toLowerCase();
        if (!filenameMap.has(filename)) {
          filenameMap.set(filename, []);
        }
        filenameMap.get(filename)!.push(doc);
      });
      
      const duplicateGroups: DuplicateGroup[] = [];
      filenameMap.forEach((documents, filename) => {
        if (documents.length > 1) {
          duplicateGroups.push({
            filename: documents[0].filename,
            documents: documents.sort((a, b) => 
              new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
            )
          });
        }
      });
      
      setDuplicates(duplicateGroups.sort((a, b) => 
        b.documents.length - a.documents.length
      ));
      
    } catch (error) {
      console.error('Fehler beim Laden der Duplikate:', error);
    } finally {
      setLoading(false);
    }
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
      loadDuplicates();
    } catch (error) {
      console.error('Fehler:', error);
      await modalService.error('Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Suche Duplikate...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <h1>🔍 Duplikate</h1>
          <span className="app-version">{APP_VERSION}</span>
        </div>
      </div>

      <div className="stats-bar">
        <span>
          {duplicates.length > 0
            ? `${duplicates.length} Duplikat-Gruppen gefunden`
            : 'Keine Duplikate gefunden'
          }
        </span>
      </div>

      <div className="page-content">
        {duplicates.length > 0 ? (
          <div className="duplicates-list">
            {duplicates.map((group, index) => (
              <div key={index} className="duplicate-group">
                <div className="group-header">
                  <h3>{group.filename}</h3>
                  <span className="duplicate-count">{group.documents.length}x</span>
                </div>
                <div className="documents-grid">
                  {group.documents.map((doc) => (
                    <div key={doc.id} className="document-card">
                      <div className="document-preview">
                        <img 
                          src={URL.createObjectURL(doc.blob)} 
                          alt={doc.filename}
                        />
                      </div>
                      <div className="document-info">
                        <p>📅 {new Date(doc.uploadDate).toLocaleDateString('de-DE')}</p>
                        {doc.customer && <p>👤 {doc.customer}</p>}
                        {doc.amount && <p>💰 {doc.amount.toFixed(2)} EUR</p>}
                      </div>
                      <div className="document-actions">
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
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-duplicates">
            <p>✅ Keine Duplikate gefunden!</p>
          </div>
        )}
      </div>
    </div>
  );
};
