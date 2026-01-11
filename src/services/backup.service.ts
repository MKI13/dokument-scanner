import { db } from './database.service';
import { importService } from './import.service';

class BackupService {
  async createBackup(): Promise<Blob> {
    const jsonString = await importService.exportToJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    return blob;
  }

  async restoreBackup(file: File): Promise<{ success: number; errors: number }> {
    try {
      const text = await file.text();
      const result = await importService.importFromJSON(text);
      return result;
    } catch (error) {
      console.error('Backup Restore Fehler:', error);
      throw error;
    }
  }

  async downloadBackup(): Promise<void> {
    try {
      const blob = await this.createBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dokument-scanner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download Fehler:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    await db.documents.clear();
  }

  async getDatabaseStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
  }> {
    const docs = await db.documents.toArray();
    const totalSize = docs.reduce((sum, doc) => sum + doc.blob.size, 0);
    
    return {
      totalDocuments: docs.length,
      totalSize
    };
  }
}

export const backupService = new BackupService();
