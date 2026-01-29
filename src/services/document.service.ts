import { db } from './database.service';
import { ocrService } from './ocr.service';
import { Document } from '../types/document';

export interface ProcessingProgress {
  status: 'idle' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface DuplicateWarning {
  isDuplicate: boolean;
  message: string;
  existingDocument?: Document;
}

class DocumentService {
  
  async processAndSaveDocument(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void,
    onDuplicateWarning?: (warning: DuplicateWarning) => Promise<boolean>,
    useProgressiveOCR: boolean = true
  ): Promise<Document> {
    
    console.log('🚀 STARTE VERARBEITUNG:', file.name);
    
    try {
      // 1. Datei-Hash berechnen
      onProgress?.({
        status: 'processing',
        progress: 10,
        message: 'Berechne Datei-Prüfsumme...'
      });

      const fileHash = await this.calculateFileHash(file);
      console.log('📝 File Hash:', fileHash);

      // 2. DUPLIKAT-CHECK
      const duplicate = await this.checkForDuplicates(fileHash);
      
      if (duplicate.isDuplicate && onDuplicateWarning) {
        console.log('⚠️ DUPLIKAT GEFUNDEN:', duplicate);
        
        const shouldContinue = await onDuplicateWarning(duplicate);
        
        if (!shouldContinue) {
          throw new Error('Upload abgebrochen - Duplikat');
        }
        
        console.log('✅ Benutzer hat Duplikat bestätigt');
      }

      // 3. OCR durchführen
      onProgress?.({
        status: 'processing',
        progress: 30,
        message: 'Starte Texterkennung...'
      });

      console.log('🔍 RUFE OCR SERVICE AUF...');
      console.log('📦 ocrService:', ocrService);
      console.log('🔧 ocrService.processImage:', typeof ocrService.processImage);

      const ocrResult = await ocrService.processImage(file, (prog) => {
        onProgress?.({
          status: 'processing',
          progress: 30 + (prog * 0.6),
          message: `Texterkennung läuft... ${Math.round(prog)}%`
        });
      });

      console.log('✅ OCR ABGESCHLOSSEN:', ocrResult);

      // 4. Dokument erstellen
      onProgress?.({
        status: 'processing',
        progress: 95,
        message: 'Speichere Dokument...'
      });

      const document: Omit<Document, 'id'> = {
        filename: this.generateFilename(ocrResult, file),
        blob: file,
        uploadDate: new Date(),
        documentDate: ocrResult.date || new Date(),
        customer: ocrResult.customer || null,
        amount: ocrResult.amount || null,
        extractedText: ocrResult.text || null,
        ocrConfidence: ocrResult.confidence || null,
        fileHash: fileHash
      };

      console.log('💾 SPEICHERE DOKUMENT:', document.filename);

      // 5. IN DATENBANK SPEICHERN
      const savedId = await db.documents.add(document as Document);
      console.log('✅ GESPEICHERT MIT ID:', savedId);

      // 6. VERIFIZIERE SPEICHERUNG
      const saved = await db.documents.get(savedId);
      console.log('🔍 VERIFIZIERUNG:', saved ? '✅ Dokument in DB' : '❌ NICHT IN DB!');

      onProgress?.({
        status: 'complete',
        progress: 100,
        message: 'Dokument erfolgreich gespeichert!'
      });

      return {
        ...document,
        id: savedId
      } as Document;

    } catch (error) {
      console.error('❌ FEHLER BEIM VERARBEITEN:', error);
      console.error('Stack:', (error as Error).stack);
      
      onProgress?.({
        status: 'error',
        progress: 0,
        message: 'Fehler: ' + (error as Error).message
      });
      
      throw error;
    }
  }

  private async checkForDuplicates(fileHash: string): Promise<DuplicateWarning> {
    try {
      const allDocuments = await db.documents.toArray();
      console.log('🔍 Prüfe gegen', allDocuments.length, 'Dokumente');
      
      const existing = allDocuments.find(doc => doc.fileHash === fileHash);
      
      if (existing) {
        console.log('⚠️ DUPLIKAT GEFUNDEN:', existing.filename);
        return {
          isDuplicate: true,
          message: `Dieses Dokument existiert bereits:\n\n` +
                   `📄 ${existing.filename}\n` +
                   `📅 ${new Date(existing.uploadDate).toLocaleString('de-DE')}\n\n` +
                   `Trotzdem hochladen?`,
          existingDocument: existing
        };
      }

      console.log('✅ Kein Duplikat');
      return { isDuplicate: false, message: '' };
      
    } catch (error) {
      console.error('❌ Fehler bei Duplikat-Check:', error);
      return { isDuplicate: false, message: '' };
    }
  }

  private async calculateFileHash(file: File): Promise<string> {
    // Prüfe ob crypto.subtle verfügbar ist (nur in HTTPS oder localhost)
    if (window.crypto && window.crypto.subtle) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('⚠️ crypto.subtle fehlgeschlagen, verwende Fallback-Hash');
      }
    }

    // Fallback für HTTP (crypto.subtle nicht verfügbar)
    console.log('ℹ️ Verwende Fallback-Hash (HTTP-Kontext)');
    return this.calculateSimpleHash(file);
  }

  private async calculateSimpleHash(file: File): Promise<string> {
    // Einfacher Hash basierend auf Dateiname, Größe und erstem/letztem Chunk
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Kombiniere Dateiname, Größe und Bytes für eindeutigen Hash
    let hash = 0;
    const str = file.name + file.size + file.lastModified;

    // String-Hash
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Erste 1KB des Inhalts
    const chunkSize = Math.min(1024, bytes.length);
    for (let i = 0; i < chunkSize; i++) {
      hash = ((hash << 5) - hash) + bytes[i];
      hash = hash & hash;
    }

    // Letzte 1KB des Inhalts (wenn Datei groß genug)
    if (bytes.length > 1024) {
      const startPos = bytes.length - 1024;
      for (let i = startPos; i < bytes.length; i++) {
        hash = ((hash << 5) - hash) + bytes[i];
        hash = hash & hash;
      }
    }

    // Konvertiere zu Hex-String
    return Math.abs(hash).toString(16).padStart(8, '0') + '-' + file.size.toString(16);
  }

  private generateFilename(ocrResult: any, file: File): string {
    // Datum im lokalen Format (ohne Timezone-Probleme)
    let date: string;
    if (ocrResult.date) {
      const d = new Date(ocrResult.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;
    } else {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;
    }

    // Kunde-Name bereinigen (kurz halten)
    let customer = 'Unbekannt';
    if (ocrResult.customer) {
      customer = ocrResult.customer
        .replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '') // Sonderzeichen entfernen
        .split(/\s+/)  // In Wörter teilen
        .filter((word: string) => word.length > 0)
        .slice(0, 2)  // Maximal 2 Wörter
        .join('_');
    }

    // Betrag formatieren
    const amount = ocrResult.amount
      ? ocrResult.amount.toFixed(2).replace('.', ',')
      : '0,00';

    const ext = file.name.split('.').pop() || 'jpg';

    return `${date}_${customer}_${amount}€.${ext}`;
  }

  async getAllDocuments(): Promise<Document[]> {
    const docs = await db.documents.toArray();
    console.log('📚 LADE', docs.length, 'DOKUMENTE');
    return docs.sort((a, b) => 
      new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
    );
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    return await db.documents.get(id);
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<void> {
    await db.documents.update(id, updates);
  }

  async deleteDocument(id: number): Promise<void> {
    await db.documents.delete(id);
  }

  async getDocumentsByMonth(year: number, month: number): Promise<Document[]> {
    const allDocs = await this.getAllDocuments();
    return allDocs.filter(doc => {
      const date = new Date(doc.documentDate);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }

  async getDocumentsByCustomer(customer: string): Promise<Document[]> {
    const allDocs = await this.getAllDocuments();
    return allDocs.filter(doc => 
      doc.customer?.toLowerCase().includes(customer.toLowerCase())
    );
  }

  async getCustomerList(): Promise<Array<{ name: string; count: number; total: number }>> {
    const allDocs = await this.getAllDocuments();
    const customerMap = new Map<string, { count: number; total: number }>();

    allDocs.forEach(doc => {
      if (doc.customer) {
        const existing = customerMap.get(doc.customer) || { count: 0, total: 0 };
        existing.count++;
        existing.total += doc.amount || 0;
        customerMap.set(doc.customer, existing);
      }
    });

    return Array.from(customerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }
}

export const documentService = new DocumentService();

// Import am Anfang der Datei hinzufügen (manuell checken!)
// import { duplicateService } from './duplicate.service';
