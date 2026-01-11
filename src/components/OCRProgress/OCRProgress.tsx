import React from 'react';
import { ProcessingProgress } from '../../services/document.service';
import './OCRProgress.css';

interface OCRProgressProps {
  progress: ProcessingProgress;
  currentFile?: number;
  totalFiles?: number;
}

export const OCRProgress: React.FC<OCRProgressProps> = ({
  progress,
  currentFile,
  totalFiles
}) => {
  const getStatusEmoji = () => {
    switch (progress.status) {
      case 'processing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = () => {
    if (currentFile && totalFiles) {
      return `Datei ${currentFile}/${totalFiles}`;
    }
    return 'Wird verarbeitet...';
  };

  return (
    <div className="ocr-progress">
      <div className="progress-header">
        <span className="progress-status">
          {getStatusEmoji()} {getStatusText()}
        </span>
        <span className="progress-percentage">
          {Math.round(progress.progress)}%
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {progress.message && (
        <div className="progress-message">
          {progress.message}
        </div>
      )}
    </div>
  );
};
