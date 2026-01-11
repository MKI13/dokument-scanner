import { documentService } from './document.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export class BackupService {
  
  // Erstelle vollständiges Backup
  static async createFullBackup(): Promise<void> {
    try {
      console.log('📦 Erstelle Backup...');
      
      const documents = await documentService.getAllDocuments();
      
      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        documentCount: documents.length,
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          originalFilename: doc.originalFilename,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          uploadDate: doc.uploadDate,
          documentDate: doc.documentDate,
          customer: doc.customer,
          amount: doc.amount,
          extractedText: doc.extractedText,
          ocrConfidence: doc.ocrConfidence,
          month: doc.month,
          year: doc.year
        }))
      };
      
      // Erstelle ZIP mit allen Daten
      const zip = new JSZip();
      
      // Metadaten
      zip.file('backup.json', JSON.stringify(backup, null, 2));
      
      // Alle Bilder
      const imagesFolder = zip.folder('images');
      for (const doc of documents) {
        imagesFolder?.file(doc.filename, doc.blob);
      }
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(zipBlob, `DokumentScanner_Backup_${timestamp}.zip`);
      
      console.log('✅ Backup erstellt!');
      
    } catch (error) {
      console.error('Backup-Fehler:', error);
      throw error;
    }
  }
  
  // Auto-Backup nach jedem Upload
  static async autoBackup(): Promise<void> {
    const lastBackup = localStorage.getItem('lastBackup');
    const now = new Date();
    
    // Backup nur einmal pro Tag
    if (lastBackup) {
      const lastDate = new Date(lastBackup);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        console.log('⏭️ Backup bereits heute erstellt');
        return;
      }
    }
    
    await this.createFullBackup();
    localStorage.setItem('lastBackup', now.toISOString());
  }
}
