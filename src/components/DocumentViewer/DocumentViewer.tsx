import React from 'react';
import { Document } from '../../types';
import { X } from 'lucide-react';
import './DocumentViewer.css';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const [imageUrl, setImageUrl] = React.useState<string>('');
  
  React.useEffect(() => {
    if (document.fileType.startsWith('image/')) {
      const url = URL.createObjectURL(document.blob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [document]);
  
  return (
    <div className="document-viewer-overlay" onClick={onClose}>
      <div className="document-viewer" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="viewer-content">
          {imageUrl && (
            <img src={imageUrl} alt={document.filename} />
          )}
        </div>
        
        <div className="viewer-info">
          <h2>{document.filename}</h2>
          {document.extractedText && (
            <div className="extracted-text">
              <h3>Erkannter Text:</h3>
              <pre>{document.extractedText}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
