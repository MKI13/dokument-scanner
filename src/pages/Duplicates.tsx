import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { modalService } from '../services/modal.service';
import { Document } from '../types/document';
import { RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import './Duplicates.css';

interface DuplicateGroup {
  hash: string;
  documents: Document[];
}

interface DuplicatesProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

export const Duplicates: React.FC<DuplicatesProps> = ({ setSwipeEnabled }) => {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    scanForDuplicates();
  }, []);

  const scanForDuplicates = async () => {
    setLoading(true);
    try {
      const allDocs = await db.documents.toArray();
      const hashMap = new Map<string, Document[]>();

      // Gruppiere nach Hash
      allDocs.forEach(doc => {
        if (!hashMap.has(doc.fileHash)) {
          hashMap.set(doc.fileHash, []);
        }
        hashMap.get(doc.fileHash)?.push(doc);
      });

      // Nur Gruppen mit >1 Dokument
      const duplicateGroups: DuplicateGroup[] = [];
      hashMap.forEach((docs, hash) => {
        if (docs.length > 1) {
          duplicateGroups.push({
            hash,
            documents: docs.sort((a, b) => 
              new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
            )
          });
        }
      });

      setGroups(duplicateGroups);
    } catch (error) {
      console.error('Fehler beim Scannen:', error);
      await modalService.error('Fehler beim Scannen der Duplikate');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: number, filename: string) => {
    const confirmed = await modalService.confirm(
      `"${filename}" wirklich löschen?`,
      'Dokument löschen'
    );

    if (!confirmed) return;

    try {
      await db.documents.delete(docId);
      await modalService.success('Dokument gelöscht!');
      scanForDuplicates();
    } catch (error) {
      console.error('Fehler:', error);
      await modalService.error('Fehler beim Löschen');
    }
  };

  const handleDeleteAllButNewest = async (group: DuplicateGroup) => {
    const confirmed = await modalService.confirm(
      `${group.documents.length - 1} ältere Version(en) löschen und nur die neueste behalten?`,
      'Nur neueste behalten'
    );

    if (!confirmed) return;

    try {
      const [newest, ...rest] = group.documents;
      
      for (const doc of rest) {
        if (doc.id) {
          await db.documents.delete(doc.id);
        }
      }

      await modalService.success('Alte Versionen gelöscht!');
      scanForDuplicates();
    } catch (error) {
      console.error('Fehler:', error);
      await modalService.error('Fehler beim Löschen');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb < 1024 ? kb.toFixed(1) + ' KB' : (kb / 1024).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Scanne nach Duplikaten...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔁 Duplikate</h1>
        <button onClick={scanForDuplicates} className="refresh-button">
          <RefreshCw size={18} />
          <span>Neu scannen</span>
        </button>
      </div>

      <div className="page-content">
        {groups.length > 0 ? (
          <>
            <div className="duplicates-stats">
              <div className="stat-item">
                <span className="stat-value">{groups.length}</span>
                <span className="stat-label">Duplikat-Gruppen</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {groups.reduce((sum, g) => sum + g.documents.length - 1, 0)}
                </span>
                <span className="stat-label">Doppelte Dokumente</span>
              </div>
            </div>

            <div className="duplicates-list">
              {groups.map((group) => (
                <div key={group.hash} className="duplicate-group">
                  <div 
                    className="duplicate-group-header"
                    onClick={() => setExpandedGroup(
                      expandedGroup === group.hash ? null : group.hash
                    )}
                  >
                    <div className="duplicate-group-info">
                      <h3>{group.documents[0].filename}</h3>
                      <span className="duplicate-count">
                        🔁 {group.documents.length}x vorhanden
                      </span>
                    </div>
                    <button className="expand-btn">
                      {expandedGroup === group.hash ? '▼' : '▶'}
                    </button>
                  </div>

                  {expandedGroup === group.hash && (
                    <div className="duplicate-items">
                      {group.documents.map((doc, idx) => (
                        <div key={doc.id} className="duplicate-item">
                          <div className="duplicate-item-preview">
                            {doc.blob ? (
                              <img 
                                src={URL.createObjectURL(doc.blob)} 
                                alt={doc.filename}
                              />
                            ) : (
                              <div className="no-preview">❌ Kein Bild</div>
                            )}
                            <span className={`item-badge ${idx === 0 ? 'newest' : ''}`}>
                              {idx === 0 ? '🆕 Neueste' : `#${idx + 1}`}
                            </span>
                          </div>

                          <div className="duplicate-item-info">
                            <div className="info-row">
                              <strong>{doc.filename}</strong>
                            </div>
                            <div className="info-row">
                              📅 {formatDate(doc.uploadDate)}
                            </div>
                            {doc.customer && (
                              <div className="info-row">
                                👤 {doc.customer}
                              </div>
                            )}
                            {doc.amount && (
                              <div className="info-row">
                                💰 {doc.amount.toFixed(2)} €
                              </div>
                            )}
                            {doc.blob && (
                              <div className="info-row small">
                                📦 {formatSize(doc.blob.size)}
                              </div>
                            )}
                          </div>

                          {doc.id && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id!, doc.filename)}
                              className="delete-btn"
                              title="Dieses Dokument löschen"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="group-actions">
                        <button
                          onClick={() => handleDeleteAllButNewest(group)}
                          className="btn-danger"
                        >
                          <Trash2 size={16} />
                          Nur neueste behalten
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-duplicates">
            <AlertCircle size={64} />
            <h2>Keine Duplikate gefunden</h2>
            <p>Alle Dokumente sind einzigartig 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};
