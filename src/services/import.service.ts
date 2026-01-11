import { db } from './database.service';
import JSZip from 'jszip';
import { Document } from '../types/document';

interface BackupMetadata {
  version: string;
  exportDate: string;
  documents: Array<{
    id?: number;
    filename: string;
    uploadDate: string;
    documentDate: string;
    customer: string | null;
    amount: number | null;
    extractedText: string | null;
    ocrConfidence: number | null;
    fileHash: string;
  }>;
}

class ImportService {
  
  async importFromBackup(jsonFile: File, zipFile: File): Promise<void> {
    console.log('📦 STARTE IMPORT...');
    console.log('  JSON:', jsonFile.name);
    console.log('  ZIP:', zipFile.name);

    try {
      // 1. Parse JSON Metadata
      const jsonText = await jsonFile.text();
      const metadata: BackupMetadata = JSON.parse(jsonText);
      
      console.log('📄 METADATA GELESEN:', metadata.documents.length, 'Dokumente');

      // 2. Lade ZIP
      const zip = await JSZip.loadAsync(zipFile);
      console.log('📦 ZIP GELADEN:', Object.keys(zip.files).length, 'Dateien');

      // 3. Importiere jedes Dokument
      let successCount = 0;
      let errorCount = 0;

      for (const docData of metadata.documents) {
        try {
          console.log('  → Importiere:', docData.filename);

          // Finde Datei im ZIP
          const zipEntry = zip.file(docData.filename);
          
          if (!zipEntry) {
            console.warn('    ⚠️ Nicht gefunden in ZIP:', docData.filename);
            errorCount++;
            continue;
          }

          // Extrahiere Blob
          const blob = await zipEntry.async('blob');
          
          // Erstelle Document Objekt
          const document: Omit<Document, 'id'> = {
            filename: docData.filename,
            blob: blob,
            uploadDate: new Date(docData.uploadDate),
            documentDate: new Date(docData.documentDate),
            customer: docData.customer,
            amount: docData.amount,
            extractedText: docData.extractedText,
            ocrConfidence: docData.ocrConfidence,
            fileHash: docData.fileHash
          };

          // Speichere in DB
          await db.documents.add(document as Document);
          
          console.log('    ✅ Importiert');
          successCount++;

        } catch (error) {
          console.error('    ❌ Fehler bei', docData.filename, ':', error);
          errorCount++;
        }
      }

      console.log('✅ IMPORT ABGESCHLOSSEN');
      console.log('  Erfolgreich:', successCount);
      console.log('  Fehler:', errorCount);

      if (errorCount > 0) {
        throw new Error(`${errorCount} Dokument(e) konnten nicht importiert werden.`);
      }

    } catch (error) {
      console.error('❌ IMPORT FEHLER:', error);
      throw error;
    }
  }

  async validateBackupFiles(jsonFile: File, zipFile: File): Promise<boolean> {
    try {
      // Prüfe JSON
      const jsonText = await jsonFile.text();
      const metadata = JSON.parse(jsonText);
      
      if (!metadata.documents || !Array.isArray(metadata.documents)) {
        throw new Error('Ungültige JSON-Struktur');
      }

      // Prüfe ZIP
      const zip = await JSZip.loadAsync(zipFile);
      
      if (Object.keys(zip.files).length === 0) {
        throw new Error('ZIP-Datei ist leer');
      }

      return true;

    } catch (error) {
      console.error('Validierung fehlgeschlagen:', error);
      return false;
    }
  }
}

export const importService = new ImportService();
