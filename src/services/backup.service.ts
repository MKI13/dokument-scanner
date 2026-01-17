import { importService } from './import.service';
import { exportService } from './export.service';

class BackupService {
  async importFromFile(file: File): Promise<{ success: number; errors: number }> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Verwende importFromBackup statt importFromJSON
      return await importService.importFromBackup(file);
    } catch (error) {
      console.error('Backup Import Fehler:', error);
      throw new Error('Fehler beim Importieren der Backup-Datei');
    }
  }

  async exportToFile(): Promise<Blob> {
    try {
      const jsonString = await exportService.exportToJSON();
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('Backup Export Fehler:', error);
      throw new Error('Fehler beim Exportieren der Backup-Datei');
    }
  }
}

export const backupService = new BackupService();
