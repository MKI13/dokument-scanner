import React, { useState, useRef } from 'react';
import { Camera, FolderOpen } from 'lucide-react';
import { documentService, ProcessingProgress } from '../services/document.service';
import { modalService } from '../services/modal.service';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="page-container">
      <div className="page-header">
        <h1>📤 Dokumente hochladen</h1>
      </div>

      <div className="page-content">
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
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.pdf"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        <div className="upload-buttons">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="upload-btn camera-btn"
          >
            <Camera size={48} />
            <span>Kamera</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="upload-btn file-btn"
          >
            <FolderOpen size={48} />
            <span>Dateien</span>
          </button>
        </div>

        {isProcessing && (
          <div className="progress-card">
            <div className="progress-header">
              <span className="progress-label">
                🔄 Datei {processingFiles.current}/{processingFiles.total}
              </span>
              <span className="progress-value">
                {Math.round(progress.progress)}%
              </span>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
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
          <div className="upload-info-text">
            <p>
              📸 Fotografiere Dokumente direkt mit der Kamera oder wähle Dateien aus dem Speicher.
            </p>
            <p>
              🔍 OCR erkennt automatisch Kundennamen, Beträge und Datumsangaben.
            </p>
            <p>
              🔁 Duplikate werden beim Upload erkannt und können übersprungen werden.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
