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
  // Falls Blob als Base64 oder data vorhanden
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
  async importFromJSON(jsonString: string): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      const data: BackupFile | BackupDocument[] = JSON.parse(jsonString);
      
      // Extrahiere documents Array
      let documents: BackupDocument[];
      if (Array.isArray(data)) {
        documents = data;
      } else if (data.documents && Array.isArray(data.documents)) {
        documents = data.documents;
        console.log(`📦 BACKUP VERSION: ${data.version}`);
        console.log(`📅 EXPORT DATUM: ${data.exportDate}`);
        console.log(`📊 DOKUMENTE: ${data.documentCount}`);
      } else {
        throw new Error('Ungültiges Backup-Format');
      }

      console.log(`\n========================================`);
      console.log(`📦 IMPORT START: ${documents.length} Dokumente`);
      console.log(`========================================\n`);

      for (let i = 0; i < documents.length; i++) {
        const backupDoc = documents[i];
        
        console.log(`\n--- Dokument ${i + 1}/${documents.length} ---`);
        console.log(`📄 ${backupDoc.filename}`);
        
        try {
          // PROBLEM: Backup hat KEIN BLOB!
          // Wir müssen die Bilddaten aus einer anderen Quelle holen
          // ODER einen Platzhalter erstellen
          
          if (!backupDoc.blob && !backupDoc.imageData && !backupDoc.base64) {
            console.warn('⚠️  KEIN BILD-DATEN im Backup!');
            console.warn('    → Erstelle Platzhalter-Blob');
            
            // Erstelle Text-Platzhalter mit Dokument-Info
            const placeholder = this.createPlaceholderBlob(backupDoc);
            backupDoc.blob = placeholder;
          }

          const validDoc = await this.convertBackupDocument(backupDoc);
          
          if (!validDoc) {
            console.error('❌ KONVERTIERUNG FEHLGESCHLAGEN');
            errors++;
            continue;
          }

          console.log('💾 FÜGE IN DB EIN...');
          
          const id = await db.documents.add(validDoc);
          
          console.log(`✅ ERFOLGREICH (ID: ${id})`);
          success++;
          
        } catch (error: any) {
          console.error('❌ FEHLER:', error.message);
          errors++;
        }
      }

      console.log(`\n========================================`);
      console.log(`✅ IMPORT FERTIG: ${success} erfolgreich, ${errors} Fehler`);
      console.log(`========================================\n`);

      return { success, errors };
      
    } catch (error: any) {
      console.error('❌ JSON PARSE FEHLER:', error);
      throw new Error('Ungültiges JSON: ' + error.message);
    }
  }

  private createPlaceholderBlob(doc: BackupDocument): Blob {
    // Erstelle SVG-Platzhalter
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#1e293b"/>
        <text x="200" y="120" font-family="Arial" font-size="16" fill="#cbd5e1" text-anchor="middle">
          📄 ${doc.filename}
        </text>
        <text x="200" y="150" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle">
          Kein Bild im Backup
        </text>
        ${doc.customer ? `
          <text x="200" y="180" font-family="Arial" font-size="12" fill="#94a3b8" text-anchor="middle">
            👤 ${doc.customer}
          </text>
        ` : ''}
        ${doc.amount ? `
          <text x="200" y="210" font-family="Arial" font-size="12" fill="#94a3b8" text-anchor="middle">
            💰 ${doc.amount.toFixed(2)} EUR
          </text>
        ` : ''}
      </svg>
    `;
    
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  private async convertBackupDocument(backupDoc: BackupDocument): Promise<Omit<Document, 'id'> | null> {
    try {
      // Konvertiere Blob
      let blob: Blob;
      
      if (backupDoc.blob instanceof Blob) {
        blob = backupDoc.blob;
      } else if (backupDoc.imageData || backupDoc.base64) {
        const base64 = backupDoc.imageData || backupDoc.base64;
        const response = await fetch(base64!);
        blob = await response.blob();
      } else if (typeof backupDoc.blob === 'string') {
        const response = await fetch(backupDoc.blob);
        blob = await response.blob();
      } else {
        console.error('❌ Kein Blob verfügbar');
        return null;
      }

      // Konvertiere Datum
      const uploadDate = new Date(backupDoc.uploadDate);
      const date = backupDoc.documentDate ? new Date(backupDoc.documentDate) : undefined;

      // Generiere fileHash falls nicht vorhanden
      const fileHash = this.generateHash(
        backupDoc.filename + 
        backupDoc.uploadDate + 
        (backupDoc.customer || '') + 
        (backupDoc.amount || '')
      );

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

      return validDocument;
      
    } catch (error: any) {
      console.error('❌ KONVERTIERUNG FEHLER:', error.message);
      return null;
    }
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

  async exportToJSON(): Promise<string> {
    const docs = await db.documents.toArray();
    
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
          return null;
        }
      })
    );

    const validExports = exportDocs.filter(d => d !== null);
    
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
