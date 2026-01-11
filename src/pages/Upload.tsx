import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload/FileUpload';
import { OCRProgress } from '../components/OCRProgress/OCRProgress';
import { documentService, ProcessingProgress } from '../services/document.service';
import { duplicateService } from '../services/duplicate.service';
import { modalService } from '../services/modal.service';
import './Upload.css';

interface UploadProps {
  setSwipeEnabled: (enabled: boolean) => void;
  onUploadComplete?: () => void;
}

export const Upload: React.FC<UploadProps> = ({ setSwipeEnabled, onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [processingFiles, setProcessingFiles] = useState({ current: 0, total: 0 });
  const [duplicatesFound, setDuplicatesFound] = useState(0);

  React.useEffect(() => {
    setSwipeEnabled(!isProcessing);
  }, [isProcessing, setSwipeEnabled]);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setProcessingFiles({ current: 0, total: files.length });
    setDuplicatesFound(0);

    let successCount = 0;
    let errorCount = 0;
    let dupCount = 0;

    // Clear alte Duplikat-Markierungen
    duplicateService.clearMarked();

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingFiles({ current: i + 1, total: files.length });

        try {
          // SMART UPLOAD: Nicht blockieren bei Duplikaten!
          await documentService.processAndSaveDocument(
            file,
            (prog) => {
              setProgress({
                ...prog,
                message: `Datei ${i + 1}/${files.length}: ${prog.message}`
              });
            },
            async (warning) => {
              // Markiere Duplikat, aber FAHRE FORT!
              console.log('🔁 DUPLIKAT GEFUNDEN (nicht blockierend)');
              dupCount++;
              setDuplicatesFound(dupCount);
              return true; // Immer weitermachen
            },
            true
          );

          successCount++;
          console.log('✅ DOKUMENT GESPEICHERT:', file.name);

        } catch (error: any) {
          if (error.message !== 'Upload abgebrochen - Duplikat') {
            errorCount++;
            console.error('❌ FEHLER:', file.name, error);
          }
        }
      }

      // Zeige Ergebnis
      if (successCount > 0) {
        let message = `${successCount} Dokument(e) erfolgreich hochgeladen!`;
        
        if (dupCount > 0) {
          message += `\n\n⚠️ ${dupCount} Duplikat(e) erkannt.\nPrüfe den Duplikate-Tab!`;
        }
        
        if (errorCount > 0) {
          message += `\n\n❌ ${errorCount} Fehler`;
        }

        await modalService.success(message);
        onUploadComplete?.();
      } else if (errorCount > 0) {
        await modalService.error(`${errorCount} Dokument(e) konnten nicht verarbeitet werden`);
      }

    } finally {
      setIsProcessing(false);
      setProgress({ status: 'idle', progress: 0, message: '' });
      setProcessingFiles({ current: 0, total: 0 });
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h2>Dokumente hochladen</h2>
        <p>Fotografiere oder wähle Dokumente zum Hochladen</p>
      </div>

      <FileUpload
        onFilesSelected={handleFilesSelected}
        disabled={isProcessing}
      />

      {isProcessing && (
        <>
          <OCRProgress
            progress={progress}
            currentFile={processingFiles.current}
            totalFiles={processingFiles.total}
          />
          
          {duplicatesFound > 0 && (
            <div className="duplicate-notice">
              <span className="duplicate-notice-icon">🔁</span>
              <span>{duplicatesFound} Duplikat(e) erkannt - Upload läuft weiter</span>
            </div>
          )}
        </>
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
              <p>Automatische Erkennung identischer Dokumente</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
