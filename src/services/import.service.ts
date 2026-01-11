import { db } from './database.service';
import { Document } from '../types/document';

class ImportService {
  async importFromJSON(jsonString: string): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      const data = JSON.parse(jsonString);
      const documents = Array.isArray(data) ? data : [data];

      console.log(`\n========================================`);
      console.log(`📦 IMPORT START: ${documents.length} Dokumente`);
      console.log(`========================================\n`);

      for (let i = 0; i < documents.length; i++) {
        const rawDoc = documents[i];
        
        console.log(`\n--- Dokument ${i + 1}/${documents.length} ---`);
        console.log(`📄 Dateiname: ${rawDoc.filename}`);
        
        try {
          // SCHRITT 1: Zeige Original-Daten
          console.log('📥 IMPORT-DATEN:', {
            filename: typeof rawDoc.filename,
            blob: typeof rawDoc.blob,
            uploadDate: typeof rawDoc.uploadDate,
            fileHash: typeof rawDoc.fileHash
          });

          // SCHRITT 2: Validiere und konvertiere
          const validDoc = await this.validateAndConvertDocument(rawDoc);
          
          if (!validDoc) {
            console.error('❌ VALIDIERUNG FEHLGESCHLAGEN');
            errors++;
            continue;
          }

          console.log('✅ VALIDIERT:', {
            filename: validDoc.filename,
            blobSize: validDoc.blob.size,
            uploadDate: validDoc.uploadDate,
            fileHash: validDoc.fileHash
          });

          // SCHRITT 3: In DB einfügen (OHNE ID!)
          console.log('💾 FÜGE IN DB EIN...');
          
          const insertData = {
            filename: validDoc.filename,
            blob: validDoc.blob,
            uploadDate: validDoc.uploadDate,
            fileHash: validDoc.fileHash,
            customer: validDoc.customer,
            amount: validDoc.amount,
            invoiceNumber: validDoc.invoiceNumber,
            date: validDoc.date,
            ocrText: validDoc.ocrText,
            tags: validDoc.tags
          };

          // VERWENDE ADD NICHT PUT - Dexie soll neue ID generieren
          const id = await db.documents.add(insertData);
          
          console.log(`✅ ERFOLGREICH EINGEFÜGT (ID: ${id})`);
          success++;
          
        } catch (error: any) {
          console.error('❌ FEHLER:', error);
          console.error('Stack:', error.stack);
          console.error('Dokument:', rawDoc);
          errors++;
        }
      }

      console.log(`\n========================================`);
      console.log(`✅ IMPORT FERTIG`);
      console.log(`   Erfolgreich: ${success}`);
      console.log(`   Fehler: ${errors}`);
      console.log(`========================================\n`);

      return { success, errors };
      
    } catch (error: any) {
      console.error('❌ JSON PARSE FEHLER:', error);
      throw new Error('Ungültiges JSON: ' + error.message);
    }
  }

  private async validateAndConvertDocument(doc: any): Promise<Omit<Document, 'id'> | null> {
    try {
      // PFLICHTFELD: filename
      if (!doc.filename || typeof doc.filename !== 'string') {
        console.error('❌ filename fehlt oder ungültig:', doc.filename);
        return null;
      }

      // PFLICHTFELD: fileHash
      if (!doc.fileHash || typeof doc.fileHash !== 'string') {
        console.warn('⚠️  fileHash fehlt - generiere neu');
        doc.fileHash = this.generateHash(doc.filename + Date.now());
      }

      // PFLICHTFELD: blob
      if (!doc.blob) {
        console.error('❌ blob fehlt komplett');
        return null;
      }

      let blob: Blob;

      // BLOB KONVERTIERUNG
      if (doc.blob instanceof Blob) {
        console.log('✅ Blob bereits vorhanden');
        blob = doc.blob;
        
      } else if (typeof doc.blob === 'string') {
        console.log('🔄 Konvertiere Base64 String zu Blob...');
        
        if (!doc.blob.startsWith('data:')) {
          console.error('❌ Ungültiger Base64 String (fehlt data:)');
          return null;
        }

        try {
          const response = await fetch(doc.blob);
          blob = await response.blob();
          console.log(`✅ Blob erstellt: ${blob.size} bytes, ${blob.type}`);
        } catch (e) {
          console.error('❌ Base64 → Blob fehlgeschlagen:', e);
          return null;
        }
        
      } else if (doc.blob?.data && Array.isArray(doc.blob.data)) {
        console.log('🔄 Konvertiere ArrayBuffer zu Blob...');
        
        const uint8Array = new Uint8Array(doc.blob.data);
        blob = new Blob([uint8Array], { type: doc.blob.type || 'image/jpeg' });
        console.log(`✅ Blob erstellt: ${blob.size} bytes`);
        
      } else {
        console.error('❌ Unbekanntes Blob-Format:', {
          type: typeof doc.blob,
          hasData: !!doc.blob?.data,
          keys: Object.keys(doc.blob || {})
        });
        return null;
      }

      // VALIDIERE BLOB
      if (blob.size === 0) {
        console.error('❌ Blob ist leer (0 bytes)');
        return null;
      }

      // PFLICHTFELD: uploadDate
      let uploadDate: Date;
      try {
        if (!doc.uploadDate) {
          console.warn('⚠️  uploadDate fehlt - verwende jetzt');
          uploadDate = new Date();
        } else if (doc.uploadDate instanceof Date) {
          uploadDate = doc.uploadDate;
        } else if (typeof doc.uploadDate === 'string' || typeof doc.uploadDate === 'number') {
          uploadDate = new Date(doc.uploadDate);
        } else {
          console.warn('⚠️  Ungültiges uploadDate Format - verwende jetzt');
          uploadDate = new Date();
        }

        if (isNaN(uploadDate.getTime())) {
          console.warn('⚠️  Ungültiges Datum - verwende jetzt');
          uploadDate = new Date();
        }
      } catch (e) {
        console.warn('⚠️  Datum-Konvertierung fehlgeschlagen - verwende jetzt');
        uploadDate = new Date();
      }

      // OPTIONALES FELD: date
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

      // ERSTELLE SAUBERES DOKUMENT
      const validDocument: Omit<Document, 'id'> = {
        filename: String(doc.filename).trim(),
        blob: blob,
        uploadDate: uploadDate,
        fileHash: String(doc.fileHash).trim(),
        customer: doc.customer ? String(doc.customer).trim() : undefined,
        amount: doc.amount ? Number(doc.amount) : undefined,
        invoiceNumber: doc.invoiceNumber ? String(doc.invoiceNumber).trim() : undefined,
        date: date,
        ocrText: doc.ocrText ? String(doc.ocrText) : undefined,
        tags: Array.isArray(doc.tags) ? doc.tags : undefined
      };

      return validDocument;
      
    } catch (error: any) {
      console.error('❌ VALIDIERUNG EXCEPTION:', error.message);
      console.error('Stack:', error.stack);
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
    console.log(`✅ ${validExports.length} exportiert`);
    
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
