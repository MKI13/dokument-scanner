import JSZip from 'jszip';
import { db } from './database.service';

class ExportService {
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
        date: doc.documentDate?.toISOString(),
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
        date: doc.documentDate?.toISOString(),
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

  async exportByCustomer(): Promise<Blob> {
    const documents = await db.documents.toArray();
    const groups = new Map<string, typeof documents>();
    
    documents.forEach(doc => {
      const key = doc.customer || 'Unbekannt';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(doc);
    });
    
    const zip = new JSZip();
    
    for (const [customer, docs] of groups) {
      const folder = zip.folder(customer);
      
      for (const doc of docs) {
        if (doc.blob && folder) {
          const extension = this.getFileExtension(doc.blob.type);
          const filename = `${doc.originalFilename}${extension}`;
          folder.file(filename, doc.blob);
        }
      }
    }
    
    return await zip.generateAsync({ type: 'blob' });
  }

  async exportByMonth(): Promise<Blob> {
    const documents = await db.documents.toArray();
    const groups = new Map<string, typeof documents>();
    
    documents.forEach(doc => {
      const key = doc.documentDate 
        ? `${doc.documentDate.getFullYear()}-${String(doc.documentDate.getMonth() + 1).padStart(2, '0')}`
        : 'Unbekannt';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(doc);
    });
    
    const zip = new JSZip();
    
    for (const [month, docs] of groups) {
      const folder = zip.folder(month);
      
      for (const doc of docs) {
        if (doc.blob && folder) {
          const extension = this.getFileExtension(doc.blob.type);
          const filename = `${doc.originalFilename}${extension}`;
          folder.file(filename, doc.blob);
        }
      }
    }
    
    return await zip.generateAsync({ type: 'blob' });
  }
}

export const exportService = new ExportService();
