import JSZip from 'jszip';
import { db } from './database.service';
import { Document } from '../types/document';

interface BackupDocument {
  filename: string;
  originalFilename: string;
  uploadDate: string;
  customer?: string;
  amount?: number;
  invoiceNumber?: string;
  date?: string;
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
          const zip = await JSZip.loadAsync(zipFile);
          const imageFolder = zip.folder('images');

          if (imageFolder) {
            const files = Object.keys(zip.files).filter(name => 
              name.startsWith('images/') && !zip.files[name].dir
            );

            for (const filename of files) {
              const file = zip.files[filename];
              const blob = await file.async('blob');
              const basename = filename.replace('images/', '');
              imageMap.set(basename, blob);
            }
          }
        } catch (error) {
          console.error('Fehler beim Laden des ZIP:', error);
        }
      }

      for (const backupDoc of backupData.documents) {
        try {
          let blob: Blob;

          const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          let foundBlob: Blob | undefined;

          for (const ext of possibleExtensions) {
            const filename = `${backupDoc.originalFilename}${ext}`;
            foundBlob = imageMap.get(filename);
            if (foundBlob) break;
          }

          if (foundBlob) {
            blob = foundBlob;
          } else {
            blob = this.createPlaceholderImage(backupDoc.filename);
          }

          const newDoc: Omit<Document, 'id'> = {
            filename: backupDoc.filename,
            originalFilename: backupDoc.originalFilename,
            blob: blob,
            uploadDate: new Date(backupDoc.uploadDate),
            customer: backupDoc.customer || undefined,
            amount: backupDoc.amount || undefined,
            invoiceNumber: backupDoc.invoiceNumber,
            date: backupDoc.date ? new Date(backupDoc.date) : undefined,
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
        customer: doc.customer,
        amount: doc.amount,
        invoiceNumber: doc.invoiceNumber,
        date: doc.date?.toISOString(),
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
        customer: doc.customer,
        amount: doc.amount,
        invoiceNumber: doc.invoiceNumber,
        date: doc.date?.toISOString(),
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
        const filename = `${doc.originalFilename}${extension}`;
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
