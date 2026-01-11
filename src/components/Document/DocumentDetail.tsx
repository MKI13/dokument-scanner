import React from 'react';
import { X, Download } from 'lucide-react';
import { Document } from '../../types/document';
import './DocumentDetail.css';

interface DocumentDetailProps {
  document: Document;
  onClose: () => void;
}

export const DocumentDetail: React.FC<DocumentDetailProps> = ({ document, onClose }) => {
  
  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = URL.createObjectURL(document.blob);
    link.download = document.filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="document-detail-overlay" onClick={onClose}>
      <div className="document-detail-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="document-detail-header">
          <h2 className="document-detail-title">{document.filename}</h2>
          <div className="document-detail-actions">
            <button onClick={handleDownload} className="document-detail-btn download">
              <Download size={16} />
              <span>Download</span>
            </button>
            <button onClick={onClose} className="document-detail-btn close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="document-detail-content">
          {/* Image */}
          <div className="document-detail-image">
            <img src={URL.createObjectURL(document.blob)} alt={document.filename} />
          </div>

          {/* Info */}
          <div className="document-detail-info">
            {document.customer && (
              <div className="document-detail-info-item">
                <div className="document-detail-info-label">Kunde</div>
                <div className="document-detail-info-value">{document.customer}</div>
              </div>
            )}

            {document.amount && (
              <div className="document-detail-info-item">
                <div className="document-detail-info-label">Betrag</div>
                <div className="document-detail-info-value amount">
                  {document.amount.toFixed(2)} €
                </div>
              </div>
            )}

            <div className="document-detail-info-item">
              <div className="document-detail-info-label">Dokumentdatum</div>
              <div className="document-detail-info-value">{formatDate(document.documentDate)}</div>
            </div>

            <div className="document-detail-info-item">
              <div className="document-detail-info-label">Hochgeladen</div>
              <div className="document-detail-info-value">{formatDate(document.uploadDate)}</div>
            </div>

            {document.ocrConfidence && (
              <div className="document-detail-info-item">
                <div className="document-detail-info-label">OCR Genauigkeit</div>
                <div className="document-detail-info-value">{document.ocrConfidence}%</div>
              </div>
            )}

            {document.extractedText && (
              <div className="document-detail-info-item">
                <div className="document-detail-info-label">Erkannter Text</div>
                <div className="document-detail-extracted-text">{document.extractedText}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
