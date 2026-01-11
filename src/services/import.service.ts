import { db } from './database.service';
import { Document } from '../types/document';

class ImportService {
  async importFromJSON(jsonString: string): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      const data = JSON.parse(jsonString);
      const documents = Array.isArray(data) ? data : [data];

      for (const doc of documents) {
        try {
          // Validiere und konvertiere Dokument
          const validDoc = await this.validateAndConvertDocument(doc);
          
          if (validDoc) {
            await db.documents.add(validDoc);
            success++;
          } else {
            console.warn('Ungültiges Dokument übersprungen:', doc);
            errors++;
          }
        } catch (error) {
          console.error('Fehler beim Importieren von Dokument:', doc, error);
          errors++;
        }
      }

      return { success, errors };
    } catch (error) {
      console.error('JSON Parse Fehler:', error);
      throw new Error('Ungültiges JSON Format');
    }
  }

  private async validateAndConvertDocument(doc: any): Promise<Document | null> {
    try {
      // Prüfe Pflichtfelder
      if (!doc.filename || !doc.fileHash) {
        console.warn('Fehlende Pflichtfelder:', doc);
        return null;
      }

      // Konvertiere Blob
      let blob: Blob;
      
      if (doc.blob instanceof Blob) {
        blob = doc.blob;
      } else if (typeof doc.blob === 'string') {
        // Base64 String zu Blob
        try {
          const byteString = atob(doc.blob.split(',')[1] || doc.blob);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          blob = new Blob([ab], { type: 'image/jpeg' });
        } catch (e) {
          console.error('Blob Konvertierung fehlgeschlagen:', e);
          return null;
        }
      } else if (doc.blob && doc.blob.data && Array.isArray(doc.blob.data)) {
        // ArrayBuffer/Uint8Array Format
        const uint8Array = new Uint8Array(doc.blob.data);
        blob = new Blob([uint8Array], { type: doc.blob.type || 'image/jpeg' });
      } else {
        console.warn('Unbekanntes Blob-Format:', typeof doc.blob);
        return null;
      }

      // Validiere Blob
      if (!blob || blob.size === 0) {
        console.warn('Leerer oder ungültiger Blob');
        return null;
      }

      // Konvertiere Datum
      const uploadDate = doc.uploadDate instanceof Date 
        ? doc.uploadDate 
        : new Date(doc.uploadDate);

      const date = doc.date 
        ? (doc.date instanceof Date ? doc.date : new Date(doc.date))
        : undefined;

      // Erstelle gültiges Dokument
      const validDocument: Document = {
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
    } catch (error) {
      console.error('Validierung fehlgeschlagen:', error);
      return null;
    }
  }

  async exportToJSON(): Promise<string> {
    const docs = await db.documents.toArray();
    
    // Konvertiere Blobs zu Base64 für Export
    const exportDocs = await Promise.all(
      docs.map(async (doc) => {
        const blobBase64 = await this.blobToBase64(doc.blob);
        return {
          ...doc,
          blob: blobBase64,
          id: undefined // ID nicht exportieren
        };
      })
    );

    return JSON.stringify(exportDocs, null, 2);
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
