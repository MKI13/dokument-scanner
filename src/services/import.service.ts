import { db } from './database.service';
import { Document } from '../types/document';

class ImportService {
  async importFromJSON(jsonString: string): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      const data = JSON.parse(jsonString);
      const documents = Array.isArray(data) ? data : [data];

      console.log(`📦 IMPORTIERE ${documents.length} DOKUMENTE`);

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        try {
          console.log(`📄 Dokument ${i + 1}/${documents.length}: ${doc.filename}`);
          
          // Validiere und konvertiere Dokument
          const validDoc = await this.validateAndConvertDocument(doc);
          
          if (validDoc) {
            // WICHTIG: Verwende put statt add um Dexie-Fehler zu vermeiden
            await db.documents.put(validDoc);
            console.log(`✅ Importiert: ${doc.filename}`);
            success++;
          } else {
            console.warn(`⚠️  Übersprungen (ungültig): ${doc.filename}`);
            errors++;
          }
        } catch (error: any) {
          console.error(`❌ Fehler bei ${doc.filename}:`, error.message || error);
          errors++;
        }
      }

      console.log(`\n✅ Import abgeschlossen: ${success} erfolgreich, ${errors} Fehler`);
      return { success, errors };
      
    } catch (error: any) {
      console.error('❌ JSON Parse Fehler:', error);
      throw new Error('Ungültiges JSON Format: ' + error.message);
    }
  }

  private async validateAndConvertDocument(doc: any): Promise<Omit<Document, 'id'> | null> {
    try {
      // Prüfe Pflichtfelder
      if (!doc.filename) {
        console.error('Fehlendes Feld: filename');
        return null;
      }
      
      if (!doc.fileHash) {
        console.warn('Fehlendes Feld: fileHash - generiere neues');
        doc.fileHash = this.generateHash(doc.filename + Date.now());
      }

      // Konvertiere Blob
      let blob: Blob;
      
      if (doc.blob instanceof Blob) {
        // Bereits ein Blob
        blob = doc.blob;
      } else if (typeof doc.blob === 'string') {
        // Base64 String
        try {
          const response = await fetch(doc.blob);
          blob = await response.blob();
        } catch (e) {
          console.error('Blob-Konvertierung fehlgeschlagen:', e);
          return null;
        }
      } else if (doc.blob?.data && Array.isArray(doc.blob.data)) {
        // ArrayBuffer Format (von JSON)
        const uint8Array = new Uint8Array(doc.blob.data);
        blob = new Blob([uint8Array], { type: doc.blob.type || 'image/jpeg' });
      } else if (doc.blob?.type && doc.blob?.size) {
        // Blob-ähnliches Objekt aus JSON
        console.warn('Blob-Metadaten gefunden, aber keine Daten - überspringe');
        return null;
      } else {
        console.error('Unbekanntes Blob-Format:', typeof doc.blob);
        return null;
      }

      // Validiere Blob
      if (!blob || blob.size === 0) {
        console.error('Leerer Blob');
        return null;
      }

      // WICHTIG: Konvertiere Datumsfelder korrekt für Dexie
      let uploadDate: Date;
      try {
        uploadDate = doc.uploadDate instanceof Date 
          ? doc.uploadDate 
          : new Date(doc.uploadDate || Date.now());
        
        // Validiere Datum
        if (isNaN(uploadDate.getTime())) {
          uploadDate = new Date();
        }
      } catch (e) {
        uploadDate = new Date();
      }

      let date: Date | undefined = undefined;
      if (doc.date) {
        try {
          date = doc.date instanceof Date ? doc.date : new Date(doc.date);
          if (isNaN(date.getTime())) {
            date = undefined;
          }
        } catch (e) {
          date = undefined;
        }
      }

      // Erstelle sauberes Dokument ohne ID
      const validDocument: Omit<Document, 'id'> = {
        filename: String(doc.filename),
        blob: blob,
        uploadDate: uploadDate,
        fileHash: String(doc.fileHash),
        customer: doc.customer ? String(doc.customer) : undefined,
        amount: doc.amount ? Number(doc.amount) : undefined,
        invoiceNumber: doc.invoiceNumber ? String(doc.invoiceNumber) : undefined,
        date: date,
        ocrText: doc.ocrText ? String(doc.ocrText) : undefined,
        tags: Array.isArray(doc.tags) ? doc.tags : undefined
      };

      return validDocument;
      
    } catch (error: any) {
      console.error('Validierung fehlgeschlagen:', error.message || error);
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
    
    console.log(`📤 EXPORTIERE ${docs.length} DOKUMENTE`);
    
    // Konvertiere Blobs zu Base64 für Export
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
          console.error('Fehler beim Exportieren von:', doc.filename, error);
          return null;
        }
      })
    );

    // Filter null values
    const validExports = exportDocs.filter(d => d !== null);
    
    console.log(`✅ ${validExports.length} Dokumente exportiert`);
    
    return JSON.stringify(validExports, null, 2);
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
