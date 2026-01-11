import React, { useState, useEffect } from 'react';
import { Eye, Edit, Download, Trash2 } from 'lucide-react';
import { Document } from '../../types/document';
import { DocumentDetail } from './DocumentDetail';
import { DocumentEditor } from '../DocumentEditor/DocumentEditor';
import { db } from '../../services/database.service';
import { modalService } from '../../services/modal.service';
import './DocumentCard.css';

interface DocumentCardProps {
  document: Document;
  showActions?: boolean;
  setSwipeEnabled?: (enabled: boolean) => void;
  onUpdate?: () => void; // ← NEU: Callback nach Update
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document,
  showActions = true,
  setSwipeEnabled,
  onUpdate
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [localDocument, setLocalDocument] = useState(document); // ← NEU: Lokaler State

  // Update lokalen State wenn document prop sich ändert
  useEffect(() => {
    setLocalDocument(document);
  }, [document]);

  useEffect(() => {
    if (setSwipeEnabled) {
      if (showDetail || showEditor) {
        setSwipeEnabled(false);
      } else {
        setSwipeEnabled(true);
      }
    }
  }, [showDetail, showEditor, setSwipeEnabled]);
  
  const handleDownload = async () => {
    try {
      const link = window.document.createElement('a');
      link.href = URL.createObjectURL(localDocument.blob);
      link.download = localDocument.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download-Fehler:', error);
      await modalService.error('Fehler beim Download!');
    }
  };
  
  const handleDelete = async () => {
    const confirmed = await modalService.confirm(
      `Dokument "${localDocument.filename}" wirklich löschen?`,
      'Löschen bestätigen'
    );
    
    if (!confirmed) return;
    
    try {
      if (localDocument.id) {
        await db.documents.delete(localDocument.id);
        
        // Trigger Parent Update
        if (onUpdate) {
          onUpdate();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Lösch-Fehler:', error);
      await modalService.error('Fehler beim Löschen!');
    }
  };
  
  const handleSaveEdit = async (updates: Partial<Document>) => {
    if (!localDocument.id) return;
    
    console.log('💾 SPEICHERE ÄNDERUNGEN FÜR ID:', localDocument.id);
    console.log('📝 UPDATES:', updates);
    
    try {
      await db.documents.update(localDocument.id, updates);
      console.log('✅ IN DB GESPEICHERT');
      
      // ← NEU: Update lokalen State sofort
      const updatedDoc = await db.documents.get(localDocument.id);
      if (updatedDoc) {
        console.log('📄 AKTUALISIERTES DOKUMENT:', updatedDoc);
        setLocalDocument(updatedDoc);
      }
      
      // Trigger Parent Update
      if (onUpdate) {
        console.log('🔄 TRIGGERE PARENT UPDATE');
        onUpdate();
      }
      
      await modalService.success('Änderungen gespeichert!');
      
    } catch (error) {
      console.error('❌ Speicher-Fehler:', error);
      await modalService.error('Fehler beim Speichern!');
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatAmount = (amount: number | null) => {
    if (!amount) return null;
    return amount.toFixed(2) + ' €';
  };
  
  return (
    <>
      <div className="document-card">
        <div className="document-card-image" onClick={() => setShowDetail(true)}>
          <img
            src={URL.createObjectURL(localDocument.blob)}
            alt={localDocument.filename}
          />
          
          {localDocument.ocrConfidence && (
            <div className="document-card-ocr-badge">
              OCR: {localDocument.ocrConfidence}%
            </div>
          )}
        </div>
        
        <div className="document-card-content">
          <h3 className="document-card-filename">{localDocument.filename}</h3>
          
          <div className="document-card-info">
            {localDocument.customer && (
              <div className="document-card-info-item">
                <span>👤</span>
                <span>{localDocument.customer}</span>
              </div>
            )}
            
            {localDocument.amount && (
              <div className="document-card-info-item">
                <span>💰</span>
                <span className="document-card-info-amount">
                  {formatAmount(localDocument.amount)}
                </span>
              </div>
            )}
            
            <div className="document-card-info-item">
              <span>📅</span>
              <span>{formatDate(localDocument.documentDate)}</span>
            </div>
          </div>
          
          {showActions && (
            <div className="document-card-actions">
              <button
                onClick={() => setShowDetail(true)}
                className="document-card-action-btn view"
                title="Ansehen"
              >
                <Eye size={16} />
              </button>
              
              <button
                onClick={() => setShowEditor(true)}
                className="document-card-action-btn edit"
                title="Bearbeiten"
              >
                <Edit size={16} />
              </button>
              
              <button
                onClick={handleDownload}
                className="document-card-action-btn download"
                title="Download"
              >
                <Download size={16} />
              </button>
              
              <button
                onClick={handleDelete}
                className="document-card-action-btn delete"
                title="Löschen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showDetail && (
        <DocumentDetail
          document={localDocument}
          onClose={() => setShowDetail(false)}
        />
      )}
      
      {showEditor && (
        <DocumentEditor
          document={localDocument}
          onSave={handleSaveEdit}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
};
