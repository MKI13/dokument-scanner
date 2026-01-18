import JSZip from 'jszip';
import { db } from './database.service';
import { Document } from '../types/document';

interface BackupDocument {
  filename: string;
  originalFilename?: string;
  uploadDate: string;
  documentDate?: string;
  customer?: string | null;
  amount?: number | null;
  extractedText?: string | null;
  ocrConfidence?: number | null;
  fileHash?: string;
  invoiceNumber?: string;
  ocrText?: string;
  tags?: string[];
}

interface BackupData {
  version: string;
  exportDate: string;
  documents: BackupDocument[];
}

class ImportService {
  async importFromBackup(
    jsonFile: File,
    zipFile?: File
  ): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      const jsonText = await jsonFile.text();
      const backupData: BackupData = JSON.parse(jsonText);

      let imageMap = new Map<string, Blob>();

      if (zipFile) {
        try {
          console.log('📦 Lade ZIP-Datei...');
          const zip = await JSZip.loadAsync(zipFile);
          const imageFolder = zip.folder('images');

          if (imageFolder) {
            const files = Object.keys(zip.files).filter(name =>
              name.startsWith('images/') && !zip.files[name].dir
            );

            console.log(`📷 Gefunden: ${files.length} Bilder im ZIP`);

            for (const filename of files) {
              const file = zip.files[filename];
              const blob = await file.async('blob');
              const basename = filename.replace('images/', '');
              imageMap.set(basename, blob);
              console.log(`   ✅ Geladen: ${basename} (${blob.size} bytes)`);
            }

            console.log(`📊 Insgesamt ${imageMap.size} Bilder in Map gespeichert`);
          } else {
            console.warn('⚠️ Kein "images" Ordner im ZIP gefunden');
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden des ZIP:', error);
        }
      } else {
        console.log('ℹ️ Kein ZIP-Archiv angegeben - erstelle Platzhalter-Bilder');
      }

      console.log(`📄 Starte Import von ${backupData.documents.length} Dokumenten...`);

      for (const backupDoc of backupData.documents) {
        try {
          let blob: Blob;

          const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          let foundBlob: Blob | undefined;

          // Erstelle Liste möglicher Basisnamen (wie beim Export)
          const possibleBasenames: string[] = [];

          if (backupDoc.originalFilename) {
            possibleBasenames.push(backupDoc.originalFilename);
          }

          // Fallback: filename ohne Extension (wie beim Export)
          const filenameWithoutExt = backupDoc.filename.replace(/\.[^/.]+$/, '');
          if (!possibleBasenames.includes(filenameWithoutExt)) {
            possibleBasenames.push(filenameWithoutExt);
          }

          console.log(`🔍 Suche Bild für "${backupDoc.filename}"`);
          console.log(`   Mögliche Basisnamen: ${possibleBasenames.join(', ')}`);

          // Suche nach Bild mit allen Kombinationen
          for (const basename of possibleBasenames) {
            for (const ext of possibleExtensions) {
              const filename = `${basename}${ext}`;
              foundBlob = imageMap.get(filename);
              if (foundBlob) {
                console.log(`   ✅ Bild gefunden: ${filename} (${foundBlob.size} bytes)`);
                break;
              }
            }
            if (foundBlob) break;
          }

          if (foundBlob) {
            blob = foundBlob;
          } else {
            console.warn(`   ⚠️ Bild nicht gefunden - Erstelle Platzhalter`);
            blob = this.createPlaceholderImage(backupDoc.filename);
          }

          const newDoc: Omit<Document, 'id'> = {
            filename: backupDoc.filename,
            originalFilename: backupDoc.originalFilename,
            blob: blob,
            uploadDate: new Date(backupDoc.uploadDate),
            documentDate: backupDoc.documentDate ? new Date(backupDoc.documentDate) : undefined,
            customer: backupDoc.customer ?? undefined,
            amount: backupDoc.amount ?? undefined,
            extractedText: backupDoc.extractedText ?? undefined,
            ocrConfidence: backupDoc.ocrConfidence ?? undefined,
            fileHash: backupDoc.fileHash,
            invoiceNumber: backupDoc.invoiceNumber,
            ocrText: backupDoc.ocrText,
            tags: backupDoc.tags
          };

          await db.documents.add(newDoc as Document);
          success++;
        } catch (error) {
          console.error('Fehler beim Import eines Dokuments:', error);
          errors++;
        }
      }

      return { success, errors };
    } catch (error) {
      console.error('Fehler beim Import:', error);
      throw error;
    }
  }

  async exportToJSON(): Promise<string> {
    const documents = await db.documents.toArray();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      documents: documents.map(doc => ({
        filename: doc.filename,
        originalFilename: doc.originalFilename,
        uploadDate: doc.uploadDate.toISOString(),
        documentDate: doc.documentDate?.toISOString(),
        customer: doc.customer,
        amount: doc.amount,
        extractedText: doc.extractedText,
        ocrConfidence: doc.ocrConfidence,
        fileHash: doc.fileHash,
        invoiceNumber: doc.invoiceNumber,
        ocrText: doc.ocrText,
        tags: doc.tags
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  async exportWithImages(): Promise<{ json: Blob; zip: Blob }> {
    const documents = await db.documents.toArray();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      documents: documents.map(doc => ({
        filename: doc.filename,
        originalFilename: doc.originalFilename,
        uploadDate: doc.uploadDate.toISOString(),
        documentDate: doc.documentDate?.toISOString(),
        customer: doc.customer,
        amount: doc.amount,
        extractedText: doc.extractedText,
        ocrConfidence: doc.ocrConfidence,
        fileHash: doc.fileHash,
        invoiceNumber: doc.invoiceNumber,
        ocrText: doc.ocrText,
        tags: doc.tags
      }))
    };

    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const zip = new JSZip();
    const folder = zip.folder('images');

    for (const doc of documents) {
      if (doc.blob && folder) {
        const extension = this.getFileExtension(doc.blob.type);
        // Verwende filename als Fallback, wenn originalFilename nicht vorhanden ist
        const basename = doc.originalFilename || doc.filename.replace(/\.[^/.]+$/, '');
        const filename = `${basename}${extension}`;
        folder.file(filename, doc.blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return { json: jsonBlob, zip: zipBlob };
  }

  private getFileExtension(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg'
    };
    
    return mimeMap[mimeType] || '.jpg';
  }

  private createPlaceholderImage(filename: string): Blob {
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#1e293b"/>
        <text x="200" y="140" font-family="Arial" font-size="16" fill="#64748b" text-anchor="middle">
          Bild nicht gefunden
        </text>
        <text x="200" y="170" font-family="Arial" font-size="12" fill="#94a3b8" text-anchor="middle">
          ${filename}
        </text>
      </svg>
    `;
    
    return new Blob([svg], { type: 'image/svg+xml' });
  }
}

export const importService = new ImportService();
