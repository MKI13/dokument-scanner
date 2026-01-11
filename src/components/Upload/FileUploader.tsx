import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import './FileUploader.css';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="file-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div
        className={`upload-area ${disabled ? 'disabled' : ''}`}
        onClick={disabled ? undefined : handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="upload-icon">
          <Upload size={48} />
        </div>

        <h2 className="upload-title">Dokumente hochladen</h2>

        <p className="upload-subtitle">
          Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
        </p>

        <button
          type="button"
          className="upload-button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <Upload size={20} />
          Dateien auswählen
        </button>

        <p className="upload-formats">
          PDF oder Bilder (JPG, PNG, HEIC, etc.)<br />
          Maximal 50 Dateien
        </p>
      </div>
    </div>
  );
};
