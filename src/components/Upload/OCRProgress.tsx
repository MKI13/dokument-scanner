import React from 'react';
import './OCRProgress.css';

interface OCRProgressProps {
  progress: {
    status: string;
    progress: number;
    message: string;
  };
  currentFile: number;
  totalFiles: number;
}

export const OCRProgress: React.FC<OCRProgressProps> = ({
  progress,
  currentFile,
  totalFiles
}) => {
  return (
    <div className="ocr-progress-container">
      <div className="ocr-progress-card">
        <div className="ocr-progress-header">
          <h3>Verarbeitung läuft...</h3>
          <span className="ocr-file-count">
            Datei {currentFile} von {totalFiles}
          </span>
        </div>

        <div className="ocr-progress-bar">
          <div
            className="ocr-progress-fill"
            style={{ width: `${progress.progress}%` }}
          />
        </div>

        <p className="ocr-progress-message">{progress.message}</p>

        <div className="ocr-spinner-container">
          <div className="ocr-spinner" />
        </div>
      </div>
    </div>
  );
};
