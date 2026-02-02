import React, { useEffect } from 'react';
import { Document } from '../types/document';
import { X, Calendar, DollarSign, User, Hash, Tag, FileText } from 'lucide-react';
import './DocumentViewer.css';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
  setSwipeEnabled?: (enabled: boolean) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  setSwipeEnabled
}) => {
  // Deaktiviere Swipe beim Öffnen
  useEffect(() => {
    if (setSwipeEnabled) {
      setSwipeEnabled(false);
    }
    
    // Aktiviere Swipe beim Schließen
    return () => {
      if (setSwipeEnabled) {
        setSwipeEnabled(true);
      }
    };
  }, [setSwipeEnabled]);

  return (
    <div className="document-viewer-overlay" onClick={onClose}>
      <div className="document-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <h2>Dokument-Ansicht</h2>
          <button onClick={onClose} className="viewer-close" title="Schließen">
            <X size={24} />
          </button>
        </div>

        <div className="viewer-content">
          <div className="viewer-image">
            <img 
              src={URL.createObjectURL(document.blob)} 
              alt={document.filename}
            />
          </div>

          <div className="viewer-info">
            <h3>Informationen</h3>

            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <Hash size={16} />
                  <span>Dateiname</span>
                </div>
                <div className="info-value">{document.filename}</div>
              </div>

              {document.customer && (
                <div className="info-item">
                  <div className="info-label">
                    <User size={16} />
                    <span>Kunde</span>
                  </div>
                  <div className="info-value">{document.customer}</div>
                </div>
              )}

              {document.amount && (
                <div className="info-item">
                  <div className="info-label">
                    <DollarSign size={16} />
                    <span>Betrag</span>
                  </div>
                  <div className="info-value">{document.amount.toFixed(2)} EUR</div>
                </div>
              )}

              {document.invoiceNumber && (
                <div className="info-item">
                  <div className="info-label">
                    <Hash size={16} />
                    <span>Rechnungsnummer</span>
                  </div>
                  <div className="info-value">{document.invoiceNumber}</div>
                </div>
              )}

              {document.documentDate && (
                <div className="info-item">
                  <div className="info-label">
                    <Calendar size={16} />
                    <span>Rechnungsdatum</span>
                  </div>
                  <div className="info-value">
                    {new Date(document.documentDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
              )}

              <div className="info-item">
                <div className="info-label">
                  <Calendar size={16} />
                  <span>Hochgeladen</span>
                </div>
                <div className="info-value">
                  {new Date(document.uploadDate).toLocaleDateString('de-DE')}
                </div>
              </div>

              {document.tags && document.tags.length > 0 && (
                <div className="info-item full-width">
                  <div className="info-label">
                    <Tag size={16} />
                    <span>Tags</span>
                  </div>
                  <div className="info-tags">
                    {document.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {document.ocrText && (
                <div className="info-item full-width">
                  <div className="info-label">
                    <FileText size={16} />
                    <span>Erkannter Text</span>
                  </div>
                  <div className="info-ocr">{document.ocrText}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
