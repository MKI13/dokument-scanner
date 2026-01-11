import React, { useState, useEffect } from 'react';
import { db } from '../services/database.service';
import { duplicateDetectionService } from '../services/duplicate-detection.service';
import { modalService } from '../services/modal.service';
import { Document } from '../types/document';
import { RefreshCw, Trash2, AlertCircle, Copy } from 'lucide-react';
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

  const handleDeleteDocument = async (docId: number) => {
    const confirmed = await modalService.confirm(
      'Dieses Dokument wirklich löschen?',
      'Löschen bestätigen'
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

  const handleKeepNewest = async (group: DuplicateGroup) => {
    const confirmed = await modalService.confirm(
      `${group.documents.length - 1} ältere Version(en) löschen?`,
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Scanne nach Duplikaten...</p>
      </div>
    );
  }

  return (
    <div className="duplicates-page">
      <div className="page-header">
        <h1>🔁 Duplikate</h1>
        <button onClick={scanForDuplicates} className="refresh-button">
          <RefreshCw size={18} />
          <span>Neu scannen</span>
        </button>
      </div>

      {groups.length > 0 ? (
        <div className="duplicates-list">
          {groups.map((group) => (
            <div key={group.hash} className="duplicate-group">
              <div className="duplicate-header">
                <h3>🔁 {group.documents.length}x vorhanden</h3>
                <button
                  onClick={() => handleKeepNewest(group)}
                  className="btn-danger"
                >
                  <Trash2 size={16} />
                  Nur neueste behalten
                </button>
              </div>

              <div className="duplicate-items">
                {group.documents.map((doc, idx) => (
                  <div key={doc.id} className="duplicate-item">
                    <div className="duplicate-preview">
                      <img src={URL.createObjectURL(doc.blob)} alt="" />
                      <span className="duplicate-badge">
                        {idx === 0 ? '🆕 Neueste' : `#${idx + 1}`}
                      </span>
                    </div>

                    <div className="duplicate-info">
                      <strong>{doc.filename}</strong>
                      <span>{new Date(doc.uploadDate).toLocaleString('de-DE')}</span>
                      {doc.customer && <span>👤 {doc.customer}</span>}
                      {doc.amount && <span>💰 {doc.amount.toFixed(2)} €</span>}
                    </div>

                    {doc.id && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id!)}
                        className="btn-delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-duplicates">
          <AlertCircle size={64} />
          <h2>Keine Duplikate gefunden</h2>
          <p>Alle Dokumente sind einzigartig 🎉</p>
        </div>
      )}
    </div>
  );
};
