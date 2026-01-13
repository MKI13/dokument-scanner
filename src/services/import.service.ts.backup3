import { db } from './database.service';
import { Document } from '../types/document';
import JSZip from 'jszip';

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
}

interface BackupFile {
  version?: string;
  exportDate?: string;
  documentCount?: number;
  documents: BackupDocument[];
}

class ImportService {
  
  // ============================================
  // HAUPT-IMPORT: JSON + ZIP KOMBINIERT
  // ============================================
  async importFromBackup(jsonFile: File, zipFile?: File): Promise<{ success: number; errors: number }> {
    console.log('========================================');
    console.log('📦 BACKUP-IMPORT GESTARTET');
    console.log('========================================');
    console.log('JSON-Datei:', jsonFile.name);
    console.log('ZIP-Datei:', zipFile ? zipFile.name : 'keine');
    console.log('');

    try {
      // 1. Lade JSON-Datenbank
      const jsonText = await jsonFile.text();
      const backupData: BackupFile | BackupDocument[] = JSON.parse(jsonText);
      
      let documents: BackupDocument[];
      if (Array.isArray(backupData)) {
        documents = backupData;
      } else if (backupData.documents) {
        documents = backupData.documents;
        console.log('📊 Backup Version:', backupData.version);
        console.log('📅 Export-Datum:', backupData.exportDate);
        console.log('📄 Dokumente:', backupData.documentCount);
      } else {
        throw new Error('Ungültiges JSON-Format');
      }

      console.log(`\n✅ ${documents.length} Dokumente in JSON gefunden\n`);

      // 2. Lade ZIP-Archiv (falls vorhanden)
      let imageMap = new Map<string, Blob>();
      
      if (zipFile) {
        console.log('📦 LADE ZIP-ARCHIV...');
        imageMap = await this.loadImagesFromZip(zipFile);
        console.log(`✅ ${imageMap.size} Bilder aus ZIP geladen\n`);
      } else {
        console.warn('⚠️  Kein ZIP-Archiv angegeben');
        console.warn('   → Erstelle Platzhalter-Bilder\n');
      }

      // 3. Importiere Dokumente
      let success = 0;
      let errors = 0;

      console.log('========================================');
      console.log('💾 IMPORTIERE DOKUMENTE');
      console.log('========================================\n');

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        console.log(`[${i + 1}/${documents.length}] ${doc.filename}`);
        
        try {
          // Suche passendes Bild im ZIP
          let blob: Blob | null = null;
          
          // Versuche verschiedene Dateinamen-Varianten
          const possibleNames = [
            doc.filename,
            doc.originalFilename,
            doc.filename.replace('.jpg', ''),
            doc.originalFilename?.replace('.jpg', '')
          ].filter(Boolean);

          for (const name of possibleNames) {
            if (name && imageMap.has(name)) {
              blob = imageMap.get(name)!;
              console.log(`  ✅ Bild gefunden: ${name} (${blob.size} bytes)`);
              break;
            }
          }

          // Falls kein Bild gefunden → Platzhalter
          if (!blob) {
            console.log('  ⚠️  Kein Bild gefunden → Platzhalter');
            blob = this.createPlaceholderBlob(doc);
          }

          // Konvertiere zu Document
          const validDoc = await this.convertToDocument(doc, blob);
          
          if (!validDoc) {
            console.error('  ❌ Konvertierung fehlgeschlagen');
            errors++;
            continue;
          }

          // Speichere in DB
          const id = await db.documents.add(validDoc);
          console.log(`  ✅ Gespeichert (ID: ${id})\n`);
          success++;
          
        } catch (error: any) {
          console.error(`  ❌ Fehler: ${error.message}\n`);
          errors++;
        }
      }

      console.log('========================================');
      console.log('✅ IMPORT ABGESCHLOSSEN');
      console.log(`   Erfolgreich: ${success}`);
      console.log(`   Fehler: ${errors}`);
      console.log('========================================\n');

      return { success, errors };
      
    } catch (error: any) {
      console.error('❌ IMPORT FEHLER:', error.message);
      throw error;
    }
  }

  // ============================================
  // LADE BILDER AUS ZIP
  // ============================================
  private async loadImagesFromZip(zipFile: File): Promise<Map<string, Blob>> {
    const imageMap = new Map<string, Blob>();
    
    try {
      const zip = await JSZip.loadAsync(zipFile);
      
      // Durchsuche alle Dateien im ZIP
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      
      for (const [path, file] of Object.entries(zip.files)) {
        // Ignoriere Ordner
        if (file.dir) continue;
        
        // Prüfe ob Bild-Datei
        const isImage = imageExtensions.some(ext => 
          path.toLowerCase().endsWith(ext)
        );
        
        if (isImage) {
          try {
            const blob = await file.async('blob');
            
            // Speichere mit verschiedenen Keys (mit/ohne Pfad)
            const filename = path.split('/').pop() || path;
            
            imageMap.set(filename, blob);
            imageMap.set(path, blob);
            
            // Auch ohne Extension
            const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
            imageMap.set(nameWithoutExt, blob);
            
            console.log(`  📷 ${filename} (${blob.size} bytes)`);
            
          } catch (error) {
            console.error(`  ⚠️  Fehler beim Laden: ${path}`);
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ ZIP-Fehler:', error.message);
      throw new Error('ZIP-Archiv konnte nicht geladen werden');
    }
    
    return imageMap;
  }

  // ============================================
  // ERSTELLE PLATZHALTER-BILD
  // ============================================
  private createPlaceholderBlob(doc: BackupDocument): Blob {
    const svg = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="400" fill="#1e293b"/>
        
        <text x="300" y="80" font-family="Arial" font-size="48" fill="#64748b" text-anchor="middle">
          📄
        </text>
        
        <text x="300" y="130" font-family="Arial" font-size="18" fill="#f1f5f9" text-anchor="middle" font-weight="bold">
          ${this.escapeXml(doc.filename)}
        </text>
        
        <text x="300" y="160" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle">
          Bild nicht im ZIP gefunden
        </text>
        
        ${doc.customer ? `
          <text x="300" y="200" font-family="Arial" font-size="16" fill="#cbd5e1" text-anchor="middle">
            👤 ${this.escapeXml(doc.customer)}
          </text>
        ` : ''}
        
        ${doc.amount ? `
          <text x="300" y="230" font-family="Arial" font-size="16" fill="#10b981" text-anchor="middle">
            💰 ${doc.amount.toFixed(2)} EUR
          </text>
        ` : ''}
        
        ${doc.documentDate ? `
          <text x="300" y="260" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle">
            📅 ${new Date(doc.documentDate).toLocaleDateString('de-DE')}
          </text>
        ` : ''}
        
        <text x="300" y="370" font-family="Arial" font-size="11" fill="#475569" text-anchor="middle">
          Platzhalter - Bild fehlt im ZIP-Archiv
        </text>
      </svg>
    `;
    
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  // ============================================
  // KONVERTIERE ZU DOCUMENT
  // ============================================
  private async convertToDocument(
    backupDoc: BackupDocument, 
    blob: Blob
  ): Promise<Omit<Document, 'id'> | null> {
    try {
      // Validiere Blob
      if (!blob || blob.size === 0) {
        console.error('  ❌ Blob ist leer');
        return null;
      }

      // Konvertiere Datum
      const uploadDate = new Date(backupDoc.uploadDate);
      const date = backupDoc.documentDate ? new Date(backupDoc.documentDate) : undefined;

      // Generiere Hash
      const fileHash = this.generateHash(
        backupDoc.filename + 
        backupDoc.uploadDate + 
        (backupDoc.customer || '') + 
        (backupDoc.amount || '')
      );

      // Erstelle Dokument
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
      console.error('  ❌ Konvertierungs-Fehler:', error.message);
      return null;
    }
  }

  // ============================================
  // NUR JSON IMPORT (FALLBACK)
  // ============================================
  async importFromJSON(jsonString: string): Promise<{ success: number; errors: number }> {
    console.warn('⚠️  NUR JSON-Import - keine Bilder!');
    console.warn('   Verwende importFromBackup() für JSON + ZIP\n');
    
    const data: BackupFile | BackupDocument[] = JSON.parse(jsonString);
    const documents = Array.isArray(data) ? data : data.documents;
    
    let success = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        const blob = this.createPlaceholderBlob(doc);
        const validDoc = await this.convertToDocument(doc, blob);
        
        if (validDoc) {
          await db.documents.add(validDoc);
          success++;
        } else {
          errors++;
        }
      } catch (error) {
        errors++;
      }
    }

    return { success, errors };
  }

  // ============================================
  // EXPORT
  // ============================================
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
