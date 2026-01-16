import React, { useState, useEffect } from 'react';
import { Document } from '../types/document';
import { db } from '../services/database.service';
import { modalService } from '../services/modal.service';
import { X, Save, Calendar, DollarSign, User, Hash, Tag } from 'lucide-react';
import './DocumentEditor.css';

interface DocumentEditorProps {
  document: Document;
  onClose: () => void;
  onSave: () => void;
  setSwipeEnabled?: (enabled: boolean) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onClose,
  onSave,
  setSwipeEnabled
}) => {
  const [filename, setFilename] = useState(document.filename);
  const [customer, setCustomer] = useState(document.customer || '');
  const [amount, setAmount] = useState(document.amount?.toString() || '');
  const [invoiceNumber, setInvoiceNumber] = useState(document.invoiceNumber || '');
  const [date, setDate] = useState(
    document.date ? new Date(document.date).toISOString().split('T')[0] : ''
  );
  const [tags, setTags] = useState(document.tags?.join(', ') || '');
  const [ocrText, setOcrText] = useState(document.ocrText || '');
  const [saving, setSaving] = useState(false);

  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  // Track if filename was manually changed
  const [filenameManuallyChanged, setFilenameManuallyChanged] = useState(false);

  // Deaktiviere Swipe beim Öffnen
  useEffect(() => {
    if (setSwipeEnabled) {
      setSwipeEnabled(false);
    }
    
    loadCustomers();
    
    // Aktiviere Swipe beim Schließen
    return () => {
      if (setSwipeEnabled) {
        setSwipeEnabled(true);
      }
    };
  }, [setSwipeEnabled]);

  const loadCustomers = async () => {
    const docs = await db.documents.toArray();
    const customers = new Set<string>();
    docs.forEach(doc => {
      if (doc.customer) customers.add(doc.customer);
    });
    setAllCustomers(Array.from(customers).sort());
  };

  // Generiere Dateiname: DATUM_KUNDE_BETRAG.jpg
  const generateFilename = () => {
    if (filenameManuallyChanged) return;

    const fileExtension = filename.includes('.') 
      ? '.' + filename.split('.').pop() 
      : '.jpg';

    const parts: string[] = [];

    // 1. DATUM (immer wenn vorhanden)
    if (date) {
      parts.push(date);
    }

    // 2. KUNDE (immer wenn vorhanden)
    if (customer.trim()) {
      parts.push(customer.trim().replace(/\s+/g, '_'));
    }

    // 3. BETRAG (immer wenn vorhanden)
    if (amount && parseFloat(amount) > 0) {
      const formattedAmount = parseFloat(amount).toFixed(2).replace('.', ',');
      parts.push(`${formattedAmount}EUR`);
    }

    // Wenn mindestens ein Teil vorhanden, erstelle Dateinamen
    if (parts.length > 0) {
      const newFilename = parts.join('_') + fileExtension;
      setFilename(newFilename);
    }
  };

  // AUTO-UPDATE bei Kunde-Änderung
  const handleCustomerChange = (newCustomer: string) => {
    setCustomer(newCustomer);
  };

  // AUTO-UPDATE bei Betrag-Änderung
  const handleAmountChange = (newAmount: string) => {
    setAmount(newAmount);
  };

  // AUTO-UPDATE bei Datum-Änderung
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
  };

  // Trigger filename generation when dependencies change
  useEffect(() => {
    generateFilename();
  }, [customer, amount, date]);

  const handleFilenameChange = (newFilename: string) => {
    setFilename(newFilename);
    setFilenameManuallyChanged(true);
  };

  const handleSave = async () => {
    if (!document.id) return;

    setSaving(true);

    try {
      const updates: Partial<Document> = {
        filename: filename.trim(),
        customer: customer.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        date: date ? new Date(date) : undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        ocrText: ocrText.trim() || undefined
      };

      await db.documents.update(document.id, updates);
      
      await modalService.success('✅ Änderungen gespeichert!');
      onSave();
      onClose();

    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      await modalService.error('Fehler beim Speichern der Änderungen');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    const hasChanges = 
      filename !== document.filename ||
      customer !== (document.customer || '') ||
      amount !== (document.amount?.toString() || '') ||
      invoiceNumber !== (document.invoiceNumber || '') ||
      date !== (document.date ? new Date(document.date).toISOString().split('T')[0] : '') ||
      tags !== (document.tags?.join(', ') || '') ||
      ocrText !== (document.ocrText || '');

    if (hasChanges) {
      const confirmed = await modalService.confirm(
        'Änderungen verwerfen?',
        'Ungespeicherte Änderungen'
      );
      if (!confirmed) return;
    }

    onClose();
  };

  const filteredCustomers = allCustomers.filter(c =>
    c.toLowerCase().includes(customer.toLowerCase())
  );

  return (
    <div className="document-editor-overlay" onClick={onClose}>
      <div className="document-editor" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>Dokument bearbeiten</h2>
          <button onClick={onClose} className="editor-close" title="Schließen">
            <X size={24} />
          </button>
        </div>

        <div className="editor-content">
          <div className="editor-preview">
            <img 
              src={URL.createObjectURL(document.blob)} 
              alt={document.filename}
            />
          </div>

          {/* HINWEIS */}
          <div className="auto-rename-hint">
            ℹ️ Format: DATUM_KUNDE_BETRAG.jpg
          </div>

          {/* Datum ZUERST */}
          <div className="editor-field">
            <label>
              <Calendar size={16} />
              <span>Rechnungsdatum</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          {/* KUNDE */}
          <div className="editor-field">
            <label>
              <User size={16} />
              <span>Kunde</span>
            </label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={customer}
                onChange={(e) => handleCustomerChange(e.target.value)}
                onFocus={() => setShowCustomerSuggestions(true)}
                placeholder="Kunde eingeben..."
              />
              {showCustomerSuggestions && customer && filteredCustomers.length > 0 && (
                <div className="autocomplete-suggestions">
                  {filteredCustomers.slice(0, 5).map(c => (
                    <div
                      key={c}
                      className="autocomplete-item"
                      onClick={() => {
                        handleCustomerChange(c);
                        setShowCustomerSuggestions(false);
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Betrag */}
          <div className="editor-field">
            <label>
              <DollarSign size={16} />
              <span>Betrag (EUR)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="77.43"
            />
          </div>

          {/* Dateiname (AUTO-GENERIERT) */}
          <div className="editor-field">
            <label>
              <Hash size={16} />
              <span>Dateiname (auto-generiert)</span>
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => handleFilenameChange(e.target.value)}
              placeholder="2024-07-15_Prosol_Farben_77,43EUR.jpg"
            />
          </div>

          {/* Rechnungsnummer */}
          <div className="editor-field">
            <label>
              <Hash size={16} />
              <span>Rechnungsnummer</span>
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="RE-2025-001..."
            />
          </div>

          {/* Tags */}
          <div className="editor-field">
            <label>
              <Tag size={16} />
              <span>Tags (komma-getrennt)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="2025-01, Büromaterial, ..."
            />
          </div>

          {/* OCR Text */}
          <div className="editor-field">
            <label>
              <span>OCR Text</span>
            </label>
            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Erkannter Text..."
              rows={6}
            />
          </div>
        </div>

        <div className="editor-footer">
          <button onClick={handleCancel} className="editor-cancel">
            Abbrechen
          </button>
          <button 
            onClick={handleSave} 
            className="editor-save"
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Speichere...' : 'Speichern'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
