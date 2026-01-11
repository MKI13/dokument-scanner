import React, { useState } from 'react';
import { X, Download, FileText, FileArchive, Package } from 'lucide-react';
import { exportService } from '../../services/export.service';
import { modalService } from '../../services/modal.service';
import './ExportDialog.css';

interface ExportDialogProps {
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose }) => {
  const [exporting, setExporting] = useState(false);

  const handleExportComplete = async () => {
    setExporting(true);
    
    try {
      await exportService.exportComplete();
      await modalService.success(
        'Backup erfolgreich erstellt!\n\n' +
        '✓ JSON-Datei (Metadaten)\n' +
        '✓ ZIP-Datei (Bilder)'
      );
      onClose();
    } catch (error) {
      console.error('Export-Fehler:', error);
      await modalService.error('Fehler beim Exportieren: ' + (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="export-dialog-header">
          <h2>Backup erstellen</h2>
          <button onClick={onClose} className="export-close-button">
            <X size={24} />
          </button>
        </div>

        {exporting ? (
          <div className="export-loading">
            <div className="export-spinner" />
            <p className="export-loading-text">Erstelle Backup...</p>
          </div>
        ) : (
          <>
            <div className="export-dialog-content">
              <div className="export-info-box">
                <Package className="export-info-icon" size={24} />
                <div className="export-info-text">
                  Es werden <strong>2 Dateien</strong> erstellt: eine JSON-Datei mit den Metadaten 
                  und eine ZIP-Datei mit allen Bildern. Beide werden benötigt, um das Backup später zu importieren.
                </div>
              </div>

              <div className="export-options">
                <div className="export-option">
                  <FileText className="export-option-icon" size={48} />
                  <div className="export-option-text">
                    <div className="export-option-title">JSON-Datei</div>
                    <div className="export-option-desc">
                      Metadaten: Kunde, Betrag, Datum, etc.
                    </div>
                  </div>
                </div>

                <div className="export-option">
                  <FileArchive className="export-option-icon" size={48} />
                  <div className="export-option-text">
                    <div className="export-option-title">ZIP-Datei</div>
                    <div className="export-option-desc">
                      Alle Original-Dokumente als Bilder
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="export-dialog-actions">
              <button onClick={onClose} className="export-close-action-button" disabled={exporting}>
                Abbrechen
              </button>
              <button onClick={handleExportComplete} className="export-submit-button" disabled={exporting}>
                <Download size={20} />
                Backup erstellen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
