import JSZip from 'jszip';
import { Document } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export type ExportFormat = 'zip' | 'jpg';
export type ExportGrouping = 'month' | 'year' | 'customer' | 'all';

interface ExportOptions {
  documents: Document[];
  format: ExportFormat;
  grouping: ExportGrouping;
  selectedMonth?: string;
  selectedYear?: number;
  selectedCustomer?: string;
}

class ExportService {
  
  async exportDocuments(options: ExportOptions): Promise<void> {
    const { documents, format: exportFormat, grouping } = options;
    
    if (documents.length === 0) {
      throw new Error('Keine Dokumente zum Exportieren');
    }
    
    console.log(`📦 Exportiere ${documents.length} Dokument(e) als ${exportFormat}, Gruppierung: ${grouping}`);
    
    if (exportFormat === 'zip') {
      await this.exportAsZip(documents, grouping, options);
    } else {
      await this.exportAsJpg(documents);
    }
  }
  
  private async exportAsZip(
    documents: Document[], 
    grouping: ExportGrouping,
    options: ExportOptions
  ): Promise<void> {
    const zip = new JSZip();
    
    // Gruppiere Dokumente
    const groups = this.groupDocuments(documents, grouping);
    
    // Füge Dokumente zum ZIP hinzu
    for (const [groupName, docs] of groups.entries()) {
      const folderName = this.sanitizeFolderName(groupName);
      const folder = grouping === 'all' ? zip : zip.folder(folderName);
      
      if (!folder) continue;
      
      for (const doc of docs) {
        const extension = this.getFileExtension(doc.originalFile.type);
        const filename = `${doc.filename}`;
        
        // Original-Datei in voller Qualität
        folder.file(filename, doc.originalFile);
      }
    }
    
    // Erstelle ZIP-Datei
    console.log('📦 Erstelle ZIP-Archiv...');
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Download
    const zipFilename = this.generateZipFilename(grouping, options);
    this.downloadBlob(blob, zipFilename);
    
    console.log('✅ Export abgeschlossen:', zipFilename);
  }
  
  private async exportAsJpg(documents: Document[]): Promise<void> {
    // Exportiere jede Datei einzeln in Original-Qualität
    for (const doc of documents) {
      const blob = doc.originalFile;
      const extension = this.getFileExtension(blob.type);
      
      // Wenn es kein Bild ist, überspringe
      if (!blob.type.startsWith('image/')) {
        console.log(`⏭️ Überspringe ${doc.filename} (kein Bild)`);
        continue;
      }
      
      this.downloadBlob(blob, doc.filename);
    }
    
    console.log('✅ Alle Bilder exportiert');
  }
  
  private groupDocuments(
    documents: Document[], 
    grouping: ExportGrouping
  ): Map<string, Document[]> {
    const groups = new Map<string, Document[]>();
    
    switch (grouping) {
      case 'month':
        documents.forEach(doc => {
          const key = doc.month || 'Unbekannt';
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(doc);
        });
        break;
        
      case 'year':
        documents.forEach(doc => {
          const key = String(doc.year);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(doc);
        });
        break;
        
      case 'customer':
        documents.forEach(doc => {
          const key = doc.customer || 'Unbekannt';
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(doc);
        });
        break;
        
      case 'all':
        groups.set('Alle_Dokumente', documents);
        break;
    }
    
    return groups;
  }
  
  private generateZipFilename(grouping: ExportGrouping, options: ExportOptions): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    
    switch (grouping) {
      case 'month':
        if (options.selectedMonth) {
          const monthFormatted = options.selectedMonth.replace('-', '_');
          return `Dokumente_${monthFormatted}_${timestamp}.zip`;
        }
        return `Dokumente_Nach_Monat_${timestamp}.zip`;
        
      case 'year':
        if (options.selectedYear) {
          return `Dokumente_${options.selectedYear}_${timestamp}.zip`;
        }
        return `Dokumente_Nach_Jahr_${timestamp}.zip`;
        
      case 'customer':
        if (options.selectedCustomer) {
          const customer = this.sanitizeFolderName(options.selectedCustomer);
          return `Dokumente_${customer}_${timestamp}.zip`;
        }
        return `Dokumente_Nach_Kunde_${timestamp}.zip`;
        
      case 'all':
        return `Alle_Dokumente_${timestamp}.zip`;
    }
  }
  
  private sanitizeFolderName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }
  
  private getFileExtension(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf'
    };
    
    return mimeMap[mimeType] || 'file';
  }
  
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Statistiken für Export-Dialog
  calculateExportSize(documents: Document[]): number {
    return documents.reduce((sum, doc) => sum + doc.fileSize, 0);
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const exportService = new ExportService();
