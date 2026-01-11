import React, { useState } from 'react';
import { X, Upload, FileText, FileArchive } from 'lucide-react';
import { importService } from '../../services/import.service';
import { modalService } from '../../services/modal.service';
import './ImportDialog.css';

interface ImportDialogProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ onClose, onImportComplete }) => {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleJsonSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJsonFile(e.target.files[0]);
    }
  };

  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setZipFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!jsonFile || !zipFile) {
      await modalService.error('Bitte wähle beide Dateien aus!');
      return;
    }

    setImporting(true);

    try {
      await importService.importFromBackup(jsonFile, zipFile);
      await modalService.success('Backup erfolgreich importiert!');
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('Import-Fehler:', error);
      await modalService.error('Fehler beim Importieren: ' + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="import-dialog-overlay" onClick={onClose}>
      <div className="import-dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="import-dialog-header">
          <h2>Backup importieren</h2>
          <button onClick={onClose} className="import-close-button">
            <X size={24} />
          </button>
        </div>

        {importing ? (
          <div className="import-loading">
            <div className="import-spinner" />
            <p className="import-loading-text">Importiere Dokumente...</p>
          </div>
        ) : (
          <>
            <div className="import-dialog-content">
              <div className="import-file-sections">
                <label className={`import-file-section ${jsonFile ? 'has-file' : ''}`}>
                  <FileText className="import-file-icon" size={48} />
                  <div className="import-file-label">1. JSON-Datei</div>
                  <div className="import-file-hint">Metadaten (Kunde, Betrag, Datum)</div>
                  {jsonFile ? (
                    <div className="import-file-name">✓ {jsonFile.name}</div>
                  ) : (
                    <div className="import-file-hint" style={{ marginTop: '8px', color: '#0ea5e9', fontWeight: 600 }}>
                      Klicken zum Auswählen
                    </div>
                  )}
                  <input type="file" accept=".json" onChange={handleJsonSelect} className="import-file-input" />
                </label>

                <label className={`import-file-section ${zipFile ? 'has-file' : ''}`}>
                  <FileArchive className="import-file-icon" size={48} />
                  <div className="import-file-label">2. ZIP-Datei</div>
                  <div className="import-file-hint">Alle Dokument-Bilder</div>
                  {zipFile ? (
                    <div className="import-file-name">✓ {zipFile.name}</div>
                  ) : (
                    <div className="import-file-hint" style={{ marginTop: '8px', color: '#0ea5e9', fontWeight: 600 }}>
                      Klicken zum Auswählen
                    </div>
                  )}
                  <input type="file" accept=".zip" onChange={handleZipSelect} className="import-file-input" />
                </label>
              </div>
            </div>

            <div className="import-dialog-actions">
              <button onClick={onClose} className="import-cancel-button" disabled={importing}>
                Abbrechen
              </button>
              <button onClick={handleImport} className="import-submit-button" disabled={!jsonFile || !zipFile || importing}>
                <Upload size={20} />
                Backup importieren
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
