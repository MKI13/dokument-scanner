import { db } from './db';
import { Document } from '../types';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDocument?: Document;
  similarity: number;
}

class DuplicateDetectionService {
  
  async checkDuplicate(file: File): Promise<DuplicateCheckResult> {
    try {
      const allDocuments = await db.documents.toArray();
      
      // 1. Dateiname-Check
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
      
      for (const doc of allDocuments) {
        const docBaseName = doc.originalFilename.replace(/\.[^/.]+$/, '').toLowerCase();
        
        if (baseName === docBaseName) {
          return {
            isDuplicate: true,
            existingDocument: doc,
            similarity: 100
          };
        }
      }
      
      // 2. Dateigröße-Check (±5%)
      const sizeTolerance = 0.05;
      for (const doc of allDocuments) {
        const sizeDiff = Math.abs(file.size - doc.fileSize) / doc.fileSize;
        
        if (sizeDiff < sizeTolerance) {
          return {
            isDuplicate: true,
            existingDocument: doc,
            similarity: Math.round((1 - sizeDiff) * 100)
          };
        }
      }
      
      return {
        isDuplicate: false,
        similarity: 0
      };
      
    } catch (error) {
      console.error('Fehler bei Duplikat-Check:', error);
      return {
        isDuplicate: false,
        similarity: 0
      };
    }
  }
  
  async findDuplicates(): Promise<Array<{ doc1: Document; doc2: Document; similarity: number }>> {
    const allDocuments = await db.documents.toArray();
    const duplicates: Array<{ doc1: Document; doc2: Document; similarity: number }> = [];
    
    for (let i = 0; i < allDocuments.length; i++) {
      for (let j = i + 1; j < allDocuments.length; j++) {
        const doc1 = allDocuments[i];
        const doc2 = allDocuments[j];
        
        // Dateiname-Vergleich
        const name1 = doc1.originalFilename.replace(/\.[^/.]+$/, '').toLowerCase();
        const name2 = doc2.originalFilename.replace(/\.[^/.]+$/, '').toLowerCase();
        
        if (name1 === name2) {
          duplicates.push({
            doc1,
            doc2,
            similarity: 100
          });
          continue;
        }
        
        // Dateigröße-Vergleich
        const sizeDiff = Math.abs(doc1.fileSize - doc2.fileSize) / Math.max(doc1.fileSize, doc2.fileSize);
        
        if (sizeDiff < 0.05) {
          duplicates.push({
            doc1,
            doc2,
            similarity: Math.round((1 - sizeDiff) * 100)
          });
        }
      }
    }
    
    return duplicates;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
