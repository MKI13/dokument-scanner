import { OCRResult } from '../types';
import { ocrService } from './ocr.service';

// VEREINFACHTE PDF-Behandlung
// PDFs werden NUR gespeichert, KEIN OCR (zu problematisch auf Termux)
class PDFService {
  
  // PDF-Seiten zählen (Approximation)
  async getPageCount(file: File): Promise<number> {
    try {
      const text = await file.text();
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      return matches ? matches.length : 1;
    } catch {
      return 1;
    }
  }
  
  // Einfaches OCR: PDF als "nicht erkennbar" markieren
  async processPDF(
    file: File,
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<OCRResult> {
    onProgress?.(1, 1, 'PDF wird gespeichert (kein OCR möglich)...');
    
    return {
      text: '[PDF - Keine Texterkennung]\n\nBitte Daten manuell eingeben.',
      confidence: 0
    };
  }
  
  // Graues Placeholder Thumbnail
  async createThumbnail(file: File, maxWidth: number = 300): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    
    // Grauer Hintergrund
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, 300, 400);
    
    // PDF Icon
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📄', 150, 180);
    
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('PDF', 150, 240);
    
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob || new Blob()), 'image/jpeg');
    });
  }
  
  async getMetadata(file: File) {
    const pages = await this.getPageCount(file);
    return {
      numPages: pages,
      info: {},
      metadata: null
    };
  }
}

export const pdfService = new PDFService();
