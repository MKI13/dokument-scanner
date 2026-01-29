import * as Tesseract from 'tesseract.js';
import { extractCustomerImproved, extractDateImproved, extractAmountImproved } from './ocr.service.improved';

export interface OCRResult {
  text: string;
  confidence: number;
  customer: string | null;
  amount: number | null;
  date: Date | null;
}

class OCRService {

  async processImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult> {

    console.log('🔍 STARTE OCR FÜR:', file.name);

    try {
      // Tesseract Worker erstellen
      const worker = await Tesseract.createWorker('deu', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            console.log(`OCR Progress: ${progress}%`);
            onProgress?.(progress);
          }
        }
      });

      console.log('✅ Worker erstellt');

      // OCR durchführen
      const { data } = await worker.recognize(file);
      
      console.log('✅ OCR ABGESCHLOSSEN');
      console.log('📄 Text:', data.text.substring(0, 300));
      console.log('🎯 Confidence:', data.confidence);

      // Worker beenden
      await worker.terminate();

      // Text extrahieren und parsen (mit verbesserten Funktionen)
      const result: OCRResult = {
        text: data.text,
        confidence: Math.round(data.confidence),
        customer: extractCustomerImproved(data.text),
        amount: extractAmountImproved(data.text),
        date: extractDateImproved(data.text)
      };

      console.log('📊 EXTRAHIERTE DATEN:', result);

      return result;

    } catch (error) {
      console.error('❌ OCR FEHLER:', error);

      return {
        text: '',
        confidence: 0,
        customer: null,
        amount: null,
        date: new Date()
      };
    }
  }

  // Extraction methods have been moved to ocr.service.improved.ts
  // They are now imported and used directly in processImage()
}

export const ocrService = new OCRService();
