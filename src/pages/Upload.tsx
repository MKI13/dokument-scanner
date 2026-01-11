import React, { useState, useRef } from 'react';
import { Camera, Upload as UploadIcon, RefreshCw } from 'lucide-react';
import { documentService, ProcessingProgress } from '../services/document.service';
import { modalService } from '../services/modal.service';
import { duplicateDetectionService } from '../services/duplicate-detection.service';
import './Upload.css';

interface UploadProps {
  setSwipeEnabled: (enabled: boolean) => void;
}

export const Upload: React.FC<UploadProps> = ({ setSwipeEnabled }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [processingFiles, setProcessingFiles] = useState({ current: 0, total: 0 });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setProcessingFiles({ current: 0, total: files.length });

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingFiles({ current: i + 1, total: files.length });

        try {
          await documentService.processAndSaveDocument(
            file,
            (prog) => {
              setProgress({
                ...prog,
                message: `Datei ${i + 1}/${files.length}: ${prog.message}`
              });
            },
            async (warning) => {
              // Duplikat-Warnung
              return await modalService.confirm(
                warning.message,
                'Duplikat gefunden'
              );
            },
            true
          );

          successCount++;
        } catch (error: any) {
          if (error.message !== 'Upload abgebrochen - Duplikat') {
            errorCount++;
            console.error('Fehler:', error);
          }
        }
      }

      if (successCount > 0) {
        await modalService.success(
          `${successCount} Dokument(e) erfolgreich hochgeladen!`
        );
      } else if (errorCount > 0) {
        await modalService.error(
          `${errorCount} Dokument(e) konnten nicht verarbeitet werden`
        );
      }

    } finally {
      setIsProcessing(false);
      setProgress({ status: 'idle', progress: 0, message: '' });
      setProcessingFiles({ current: 0, total: 0 });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFilesSelected(Array.from(files));
      event.target.value = '';
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h2>Dokumente hochladen</h2>
        <p>Fotografiere oder wähle Dokumente zum Hochladen</p>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isProcessing}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isProcessing}
      />

      <div className="file-upload">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="upload-button camera"
        >
          <Camera size={32} />
          <span>Kamera</span>
        </button>

        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={isProcessing}
          className="upload-button gallery"
        >
          <UploadIcon size={32} />
          <span>Galerie</span>
        </button>
      </div>

      {isProcessing && (
        <div className="ocr-progress">
          <div className="progress-header">
            <span className="progress-status">
              🔄 Datei {processingFiles.current}/{processingFiles.total}
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
      )}

      {!isProcessing && (
        <div className="upload-info">
          <div className="info-card">
            <span className="info-icon">📸</span>
            <div>
              <h3>Kamera</h3>
              <p>Fotografiere Dokumente direkt</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">📁</span>
            <div>
              <h3>Galerie</h3>
              <p>Wähle Bilder aus deiner Galerie</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">🔍</span>
            <div>
              <h3>Automatische OCR</h3>
              <p>Texterkennung für Kunde, Betrag, Datum</p>
            </div>
          </div>

          <div className="info-card">
            <span className="info-icon">🔁</span>
            <div>
              <h3>Duplikat-Erkennung</h3>
              <p>Warnung bei identischen Dokumenten</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
