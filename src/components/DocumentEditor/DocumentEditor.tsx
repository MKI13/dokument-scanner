import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Document } from '../../types/document';
import './DocumentEditor.css';

interface DocumentEditorProps {
  document: Document;
  onSave: (updates: Partial<Document>) => Promise<void>;
  onClose: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onSave,
  onClose
}) => {
  const [customer, setCustomer] = useState(document.customer || '');
  const [amount, setAmount] = useState(document.amount?.toString() || '');
  const [date, setDate] = useState(
    new Date(document.documentDate).toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  // ← NEU: Generate Filename basierend auf aktuellen Werten
  const generateFilename = (): string => {
    const dateStr = date; // Already in YYYY-MM-DD format
    
    const customerStr = customer.trim() 
      ? customer.trim().replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
      : 'Unbekannt';
    
    const amountStr = amount 
      ? parseFloat(amount).toFixed(2).replace('.', ',')
      : '0,00';
    
    // Behalte die Original-Dateiendung
    const ext = document.filename.split('.').pop() || 'jpg';
    
    return `${dateStr}_${customerStr}_${amountStr}€.${ext}`;
  };

  // Preview des neuen Dateinamens
  const previewFilename = generateFilename();

  const handleSave = async () => {
    console.log('💾 SPEICHERE ÄNDERUNGEN...');
    console.log('  Kunde:', customer);
    console.log('  Betrag:', amount);
    console.log('  Datum:', date);
    
    setSaving(true);
    
    try {
      const newFilename = generateFilename();
      
      const updates: Partial<Document> = {
        customer: customer.trim() || null,
        amount: amount ? parseFloat(amount) : null,
        documentDate: new Date(date),
        filename: newFilename // ← NEU: Filename wird automatisch gesetzt!
      };

      console.log('📝 UPDATES:', updates);
      console.log('📄 NEUER DATEINAME:', newFilename);

      await onSave(updates);
      
      console.log('✅ ERFOLGREICH GESPEICHERT');
      
      setTimeout(() => {
        onClose();
      }, 300);
      
    } catch (error) {
      console.error('❌ FEHLER BEIM SPEICHERN:', error);
      alert('Fehler beim Speichern: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="document-editor-overlay" onClick={onClose}>
      <div className="document-editor-container" onClick={(e) => e.stopPropagation()}>
        <div className="document-editor-header">
          <h2>Dokument bearbeiten</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        <div className="document-editor-content">
          <div className="document-editor-preview">
            <img
              src={URL.createObjectURL(document.blob)}
              alt={document.filename}
              className="preview-image"
            />
          </div>

          <div className="document-editor-form">
            <div className="form-group">
              <label htmlFor="customer">Kunde</label>
              <input
                id="customer"
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Kundenname"
                disabled={saving}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Betrag (€)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Datum</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Dateiname (wird automatisch generiert)</label>
              <div className="filename-preview">
                <div className="filename-old">
                  Alt: <code>{document.filename}</code>
                </div>
                <div className="filename-arrow">↓</div>
                <div className="filename-new">
                  Neu: <code>{previewFilename}</code>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={onClose}
                className="cancel-button"
                disabled={saving}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="save-button"
                disabled={saving}
              >
                <Save size={18} />
                {saving ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
