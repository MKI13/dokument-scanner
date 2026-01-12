import { db } from './database.service';
import { Document } from '../types/document';
import JSZip from 'jszip';

interface BackupDocument {
  filename: string;
  originalFilename?: string;
  uploadDate: string;
  documentDate?: string;
  customer?: string;
  amount?: number;
  extractedText?: string;
  month?: number;
  year?: number;
  blob?: any;
  imageData?: string;
  base64?: string;
}

interface BackupFile {
  documents: BackupDocument[];
}

class ImportService {

  /* =====================================================
     🔹 ÖFFENTLICHE API (für Upload / ImportDialog)
     ===================================================== */

  async importFromBackup(jsonFile?: File, zipFile?: File) {
    if (zipFile) return this.importFromZip(zipFile);
    if (jsonFile) return this.importFromJSON(await jsonFile.text());
    throw new Error('Keine Import-Datei angegeben');
  }

  async exportToJSON(): Promise<string> {
    const docs = await db.documents.toArray();
    return JSON.stringify({ documents: docs }, null, 2);
  }

  /* =====================================================
     🔹 JSON IMPORT
     ===================================================== */

  async importFromJSON(jsonString: string): Promise<{ success: number; errors: number }> {
    const parsed: BackupFile | BackupDocument[] = JSON.parse(jsonString);
    const documents = Array.isArray(parsed) ? parsed : parsed.documents;

    let success = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        if (!doc.blob && !doc.imageData && !doc.base64) {
          doc.blob = this.createPlaceholderBlob(doc);
        }

        const valid = await this.convertBackupDocument(doc);
        if (!valid) {
          errors++;
          continue;
        }

        await db.documents.add(valid);
        success++;
      } catch {
        errors++;
      }
    }

    return { success, errors };
  }

  /* =====================================================
     🔹 ZIP IMPORT
     ===================================================== */

  async importFromZip(zipFile: File): Promise<{ success: number; errors: number }> {
    const zip = await JSZip.loadAsync(zipFile);
    const jsonFile = zip.file('backup.json');
    if (!jsonFile) throw new Error('backup.json fehlt im ZIP');

    const parsed = JSON.parse(await jsonFile.async('string'));
    const documents = Array.isArray(parsed) ? parsed : parsed.documents;

    const imageMap = new Map<string, Blob>();
    for (const [path, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      if (!path.match(/\.(png|jpg|jpeg|webp|svg)$/i)) continue;
      const blob = await file.async('blob');
      const name = path.split('/').pop();
      if (name) imageMap.set(name, blob);
    }

    let success = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        if (!doc.blob) {
          const img = imageMap.get(doc.filename) || imageMap.get(doc.originalFilename || '');
          if (img) doc.blob = img;
        }

        const valid = await this.convertBackupDocument(doc);
        if (!valid) {
          errors++;
          continue;
        }

        await db.documents.add(valid);
        success++;
      } catch {
        errors++;
      }
    }

    return { success, errors };
  }

  /* =====================================================
     🔹 HILFSMETHODEN
     ===================================================== */

  private createPlaceholderBlob(doc: BackupDocument): Blob {
    const svg =
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="400" height="300" fill="#1e293b"/>' +
      '<text x="200" y="150" font-size="16" fill="#cbd5e1" text-anchor="middle">' +
      doc.filename +
      '</text>' +
      '</svg>';

    return new Blob([svg], { type: 'image/svg+xml' });
  }

  private async convertBackupDocument(doc: BackupDocument): Promise<Omit<Document, 'id'> | null> {
    try {
      let blob: Blob;

      if (doc.blob instanceof Blob) {
        blob = doc.blob;
      } else if (doc.imageData) {
        const r = await fetch(doc.imageData);
        blob = await r.blob();
      } else if (doc.base64) {
        const r = await fetch(doc.base64);
        blob = await r.blob();
      } else {
        return null;
      }

      return {
        filename: doc.filename,
        blob,
        uploadDate: new Date(doc.uploadDate),
        fileHash: this.generateHash(doc.filename + doc.uploadDate),
        customer: doc.customer ?? null,
        amount: doc.amount ?? null,
        originalFilename: doc.originalFilename,
        date: doc.documentDate ? new Date(doc.documentDate) : undefined,
        ocrText: doc.extractedText,
        tags: doc.month && doc.year ? [`${doc.year}-${String(doc.month).padStart(2, '0')}`] : undefined
      };
    } catch {
      return null;
    }
  }

  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

export const importService = new ImportService();
