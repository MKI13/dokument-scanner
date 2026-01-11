import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Document } from '../../types';
import { format } from 'date-fns';
import { extractionService } from '../../services/extraction.service';

interface DocumentEditorProps {
  document: Document | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Document>) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onClose,
  onSave
}) => {
  const [filename, setFilename] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [customer, setCustomer] = useState('');
  const [type, setType] = useState<Document['type']>('other');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  
  useEffect(() => {
    if (document) {
      setFilename(document.filename);
      setDocumentDate(document.documentDate ? format(document.documentDate, 'yyyy-MM-dd') : '');
      setCustomer(document.customer || '');
      setType(document.type);
      setAmount(document.amount !== null ? String(document.amount) : '');
      setNotes(document.notes);
      setTags(document.tags.join(', '));
    }
  }, [document]);
  
  const handleSave = () => {
    if (!document) return;
    
    const newDate = documentDate ? new Date(documentDate) : null;
    
    // WICHTIG: Berechne month und year aus dem neuen Datum!
    const month = newDate ? extractionService.getMonthString(newDate) : null;
    const year = newDate ? newDate.getFullYear() : new Date().getFullYear();
    
    const updates: Partial<Document> = {
      filename,
      documentDate: newDate,
      customer: customer || null,
      type,
      amount: amount ? parseFloat(amount.replace(',', '.')) : null,
      month,  // NEU: month wird aktualisiert
      year,   // NEU: year wird aktualisiert
      notes,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      manuallyEdited: true
    };
    
    console.log('💾 Speichere Updates:', updates);
    onSave(document.id, updates);
  };
  
  if (!document) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content document-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Dokument bearbeiten</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Dateiname</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Datum</label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Kunde / Firma</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="z.B. Hagebaumarkt"
            />
          </div>
          
          <div className="form-group">
            <label>Typ</label>
            <select value={type} onChange={(e) => setType(e.target.value as Document['type'])}>
              <option value="invoice">Rechnung</option>
              <option value="delivery">Lieferschein</option>
              <option value="quote">Angebot</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Brutto-Betrag (€)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="z.B. 45.50"
            />
            <small>Format: 45.50 oder 45,50</small>
          </div>
          
          <div className="form-group">
            <label>Tags (kommagetrennt)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="z.B. Kassenbon, Dringend"
            />
          </div>
          
          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Zusätzliche Informationen..."
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Abbrechen
          </button>
          <button className="save-button" onClick={handleSave}>
            <Save size={18} />
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
