import { db } from './database.service';
import { Document } from '../types/document';

interface BackupDocument {
  id?: number;
  filename: string;
  originalFilename?: string;
  fileType?: string;
  fileSize?: number;
  uploadDate: string;
  documentDate?: string;
  customer?: string;
  amount?: number;
  extractedText?: string;
  ocrConfidence?: number;
  month?: number;
  year?: number;
  // Bild-Daten (verschiedene Formate)
  blob?: any;
  imageData?: string;
  base64?: string;
}

interface BackupFile {
  version?: string;
  exportDate?: string;
  documentCount?: number;
  documents: BackupDocument[];
}

class ImportService {
  // ============================================
  // HAUPT-IMPORT FUNKTION
  // ============================================
  async importFromJSON(jsonString: string): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      const data: BackupFile | BackupDocument[] = JSON.parse(jsonString);
      
      // Extrahiere documents Array
      let documents: BackupDocument[];
      if (Array.isArray(data)) {
        console.log('📦 Import: Array-Format');
        documents = data;
      } else if (data.documents && Array.isArray(data.documents)) {
        console.log('📦 Import: Backup-Format');
        console.log(`   Version: ${data.version || 'unbekannt'}`);
        console.log(`   Export-Datum: ${data.exportDate || 'unbekannt'}`);
        console.log(`   Dokumente: ${data.documentCount || documents.length}`);
        documents = data.documents;
      } else {
        throw new Error('Ungültiges Backup-Format');
      }

      console.log(`\n========================================`);
      console.log(`📥 IMPORT START: ${documents.length} Dokumente`);
      console.log(`========================================\n`);

      // Importiere jedes Dokument
      for (let i = 0; i < documents.length; i++) {
        const backupDoc = documents[i];
        
        console.log(`\n[${i + 1}/${documents.length}] ${backupDoc.filename}`);
        
        try {
          // WICHTIG: Prüfe ob Bild-Daten vorhanden
          if (!backupDoc.blob && !backupDoc.imageData && !backupDoc.base64) {
            console.warn('  ⚠️  Kein Bild im Backup gefunden');
            console.warn('  → Erstelle Platzhalter-Bild mit Metadaten');
            backupDoc.blob = this.createPlaceholderBlob(backupDoc);
          }

          // Konvertiere zu Document-Format
          const validDoc = await this.convertBackupDocument(backupDoc);
          
          if (!validDoc) {
            console.error('  ❌ Konvertierung fehlgeschlagen');
            errors++;
            continue;
          }

          // Füge in Datenbank ein
          console.log('  💾 Füge in DB ein...');
          const id = await db.documents.add(validDoc);
          
          console.log(`  ✅ Gespeichert (ID: ${id})`);
          success++;
          
        } catch (error: any) {
          console.error(`  ❌ Fehler: ${error.message}`);
          console.error('     Stack:', error.stack);
          errors++;
        }
      }

      console.log(`\n========================================`);
      console.log(`✅ IMPORT ABGESCHLOSSEN`);
      console.log(`   Erfolgreich: ${success}`);
      console.log(`   Fehler: ${errors}`);
      console.log(`========================================\n`);

      return { success, errors };
      
    } catch (error: any) {
      console.error('❌ JSON PARSE FEHLER:', error.message);
      throw new Error('Ungültiges JSON Format: ' + error.message);
    }
  }

  // ============================================
  // ERSTELLE PLATZHALTER-BILD
  // ============================================
  private createPlaceholderBlob(doc: BackupDocument): Blob {
    // Erstelle SVG mit Dokumenten-Informationen
    const svg = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <!-- Hintergrund -->
        <rect width="600" height="400" fill="#1e293b"/>
        
        <!-- Icon -->
        <text x="300" y="80" font-family="Arial" font-size="48" fill="#64748b" text-anchor="middle">
          📄
        </text>
        
        <!-- Dateiname -->
        <text x="300" y="130" font-family="Arial" font-size="18" fill="#f1f5f9" text-anchor="middle" font-weight="bold">
          ${this.escapeXml(doc.filename)}
        </text>
        
        <!-- Info: Kein Bild -->
        <text x="300" y="160" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle">
          Kein Bild im Backup vorhanden
        </text>
        
        <!-- Kunde -->
        ${doc.customer ? `
          <text x="300" y="200" font-family="Arial" font-size="16" fill="#cbd5e1" text-anchor="middle">
            👤 ${this.escapeXml(doc.customer)}
          </text>
        ` : ''}
        
        <!-- Betrag -->
        ${doc.amount ? `
          <text x="300" y="230" font-family="Arial" font-size="16" fill="#10b981" text-anchor="middle">
            💰 ${doc.amount.toFixed(2)} EUR
          </text>
        ` : ''}
        
        <!-- Datum -->
        ${doc.documentDate ? `
          <text x="300" y="260" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle">
            📅 ${new Date(doc.documentDate).toLocaleDateString('de-DE')}
          </text>
        ` : ''}
        
        <!-- OCR Text (erste Zeile) -->
        ${doc.extractedText ? `
          <text x="300" y="310" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">
            OCR: ${this.escapeXml(doc.extractedText.substring(0, 50))}...
          </text>
        ` : ''}
        
        <!-- Footer -->
        <text x="300" y="370" font-family="Arial" font-size="11" fill="#475569" text-anchor="middle">
          Platzhalter - Original-Bild nicht im Backup enthalten
        </text>
      </svg>
    `;
    
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  // ============================================
  // KONVERTIERE BACKUP → DOCUMENT
  // ============================================
  private async convertBackupDocument(backupDoc: BackupDocument): Promise<Omit<Document, 'id'> | null> {
    try {
      let blob: Blob;
      
      // BLOB KONVERTIERUNG
      if (backupDoc.blob instanceof Blob) {
        // Bereits ein Blob
        blob = backupDoc.blob;
        console.log(`  📦 Blob: ${blob.size} bytes (${blob.type})`);
        
      } else if (backupDoc.imageData || backupDoc.base64) {
        // Base64 String
        console.log('  🔄 Konvertiere Base64 → Blob...');
        const base64 = backupDoc.imageData || backupDoc.base64;
        
        if (!base64) {
          console.error('  ❌ Base64 String ist leer');
          return null;
        }
        
        try {
          const response = await fetch(base64);
          blob = await response.blob();
          console.log(`  ✅ Blob erstellt: ${blob.size} bytes`);
        } catch (e) {
          console.error('  ❌ Base64-Konvertierung fehlgeschlagen:', e);
          return null;
        }
        
      } else if (typeof backupDoc.blob === 'string') {
        // String → Blob
        console.log('  🔄 Konvertiere String → Blob...');
        const response = await fetch(backupDoc.blob);
        blob = await response.blob();
        console.log(`  ✅ Blob erstellt: ${blob.size} bytes`);
        
      } else {
        console.error('  ❌ Unbekanntes Blob-Format:', typeof backupDoc.blob);
        return null;
      }

      // Validiere Blob
      if (!blob || blob.size === 0) {
        console.error('  ❌ Blob ist leer (0 bytes)');
        return null;
      }

      // DATUM KONVERTIERUNG
      let uploadDate: Date;
      try {
        uploadDate = new Date(backupDoc.uploadDate);
        if (isNaN(uploadDate.getTime())) {
          console.warn('  ⚠️  Ungültiges Upload-Datum → verwende jetzt');
          uploadDate = new Date();
        }
      } catch (e) {
        uploadDate = new Date();
      }

      let date: Date | undefined = undefined;
      if (backupDoc.documentDate) {
        try {
          date = new Date(backupDoc.documentDate);
          if (isNaN(date.getTime())) {
            date = undefined;
          }
        } catch (e) {
          date = undefined;
        }
      }

      // GENERIERE HASH
      const fileHash = this.generateHash(
        backupDoc.filename + 
        backupDoc.uploadDate + 
        (backupDoc.customer || '') + 
        (backupDoc.amount || '')
      );

      // ERSTELLE DOKUMENT
      const validDocument: Omit<Document, 'id'> = {
        filename: backupDoc.filename,
        blob: blob,
        uploadDate: uploadDate,
        fileHash: fileHash,
        customer: backupDoc.customer,
        amount: backupDoc.amount,
        invoiceNumber: backupDoc.originalFilename,
        date: date,
        ocrText: backupDoc.extractedText,
        tags: backupDoc.month && backupDoc.year 
          ? [`${backupDoc.year}-${String(backupDoc.month).padStart(2, '0')}`]
          : undefined
      };

      console.log('  ✅ Dokument konvertiert');
      return validDocument;
      
    } catch (error: any) {
      console.error('  ❌ Konvertierungs-Fehler:', error.message);
      return null;
    }
  }

  // ============================================
  // HILFSFUNKTIONEN
  // ============================================
  
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // ============================================
  // EXPORT FUNKTION
  // ============================================
  
  async exportToJSON(): Promise<string> {
    const docs = await db.documents.toArray();
    
    console.log(`📤 Exportiere ${docs.length} Dokumente...`);
    
    const exportDocs = await Promise.all(
      docs.map(async (doc) => {
        try {
          const blobBase64 = await this.blobToBase64(doc.blob);
          return {
            filename: doc.filename,
            blob: blobBase64,
            uploadDate: doc.uploadDate.toISOString(),
            fileHash: doc.fileHash,
            customer: doc.customer,
            amount: doc.amount,
            invoiceNumber: doc.invoiceNumber,
            date: doc.date?.toISOString(),
            ocrText: doc.ocrText,
            tags: doc.tags
          };
        } catch (error) {
          console.error('Export-Fehler:', doc.filename, error);
          return null;
        }
      })
    );

    const validExports = exportDocs.filter(d => d !== null);
    
    console.log(`✅ ${validExports.length} Dokumente exportiert`);
    
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      documentCount: validExports.length,
      documents: validExports
    }, null, 2);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const importService = new ImportService();
