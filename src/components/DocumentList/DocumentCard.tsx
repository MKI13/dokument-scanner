import React, { useState } from 'react';
import { Document } from '../../types';
import { Calendar, User, DollarSign, FileText, Download, Trash2, Eye, Edit, Clock } from 'lucide-react';
import './DocumentCard.css';

interface DocumentCardProps {
  document: Document;
  onView: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (id: number) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document, 
  onView,
  onEdit,
  onDelete 
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  React.useEffect(() => {
    if (document.fileType.startsWith('image/')) {
      const url = URL.createObjectURL(document.blob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [document]);
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = URL.createObjectURL(document.blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(document);
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && document.id !== undefined) {
      onDelete(document.id);
    }
    setShowDeleteConfirm(false);
  };
  
  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div className="document-card" onClick={() => onView(document)}>
      {imageUrl && (
        <div className="document-preview">
          <img src={imageUrl} alt={document.filename} />
          <div className="preview-overlay">
            <Eye size={24} />
          </div>
        </div>
      )}
      
      <div className="document-info">
        <h3 className="document-title">{document.filename}</h3>
        
        <div className="document-meta">
          {document.customer && (
            <div className="meta-item">
              <User size={16} />
              <span>{document.customer}</span>
            </div>
          )}
          
          {document.amount && (
            <div className="meta-item">
              <DollarSign size={16} />
              <span>{document.amount.toFixed(2)} €</span>
            </div>
          )}
          
          <div className="meta-item">
            <Calendar size={16} />
            <span>{formatDate(document.documentDate)}</span>
          </div>
          
          <div className="meta-item upload-date">
            <Clock size={16} />
            <span title="Hochgeladen am">{formatDateTime(document.uploadDate)}</span>
          </div>
          
          {document.extractedText && (
            <div className="meta-item">
              <FileText size={16} />
              <span>{document.extractedText.length} Zeichen</span>
            </div>
          )}
        </div>
        
        {document.ocrConfidence > 0 && (
          <div className="ocr-confidence">
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ 
                  width: `${document.ocrConfidence}%`,
                  background: getConfidenceColor(document.ocrConfidence)
                }}
              />
            </div>
            <span className="confidence-text">OCR: {document.ocrConfidence}%</span>
          </div>
        )}
      </div>
      
      <div className="document-actions">
        {onEdit && (
          <button 
            className="action-button edit"
            onClick={handleEdit}
            title="Bearbeiten"
          >
            <Edit size={18} />
          </button>
        )}
        
        <button 
          className="action-button download"
          onClick={handleDownload}
          title="Herunterladen"
        >
          <Download size={18} />
        </button>
        
        {onDelete && (
          <button 
            className="action-button delete"
            onClick={handleDelete}
            title="Löschen"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      
      {showDeleteConfirm && (
        <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-content">
            <p>Dokument wirklich löschen?</p>
            <p className="confirm-id">ID: {document.id}</p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={confirmDelete}>
                Ja, löschen
              </button>
              <button className="confirm-no" onClick={cancelDelete}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
