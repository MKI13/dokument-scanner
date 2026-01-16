import React from 'react';
import { Document } from '../types/document';
import { X, Calendar, DollarSign, User, Hash, Tag, FileText } from 'lucide-react';
import './DocumentViewer.css';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose
}) => {
  return (
    <div className="document-viewer-overlay" onClick={onClose}>
      <div className="document-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <h2>Dokument-Ansicht</h2>
          <button onClick={onClose} className="viewer-close">
            <X size={20} />
          </button>
        </div>

        <div className="viewer-content">
          {/* Bild/PDF Vollansicht */}
          <div className="viewer-image">
            <img 
              src={URL.createObjectURL(document.blob)} 
              alt={document.filename}
            />
          </div>

          {/* Dokument-Informationen */}
          <div className="viewer-info">
            <h3>Informationen</h3>

            <div className="info-grid">
              {/* Dateiname */}
              <div className="info-item">
                <div className="info-label">
                  <Hash size={16} />
                  <span>Dateiname</span>
                </div>
                <div className="info-value">{document.filename}</div>
              </div>

              {/* Kunde */}
              {document.customer && (
                <div className="info-item">
                  <div className="info-label">
                    <User size={16} />
                    <span>Kunde</span>
                  </div>
                  <div className="info-value">{document.customer}</div>
                </div>
              )}

              {/* Betrag */}
              {document.amount && (
                <div className="info-item">
                  <div className="info-label">
                    <DollarSign size={16} />
                    <span>Betrag</span>
                  </div>
                  <div className="info-value">{document.amount.toFixed(2)} EUR</div>
                </div>
              )}

              {/* Rechnungsnummer */}
              {document.invoiceNumber && (
                <div className="info-item">
                  <div className="info-label">
                    <Hash size={16} />
                    <span>Rechnungsnummer</span>
                  </div>
                  <div className="info-value">{document.invoiceNumber}</div>
                </div>
              )}

              {/* Datum */}
              {document.date && (
                <div className="info-item">
                  <div className="info-label">
                    <Calendar size={16} />
                    <span>Rechnungsdatum</span>
                  </div>
                  <div className="info-value">
                    {new Date(document.date).toLocaleDateString('de-DE')}
                  </div>
                </div>
              )}

              {/* Upload-Datum */}
              <div className="info-item">
                <div className="info-label">
                  <Calendar size={16} />
                  <span>Hochgeladen</span>
                </div>
                <div className="info-value">
                  {new Date(document.uploadDate).toLocaleDateString('de-DE')}
                </div>
              </div>

              {/* Tags */}
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

              {/* OCR Text */}
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
