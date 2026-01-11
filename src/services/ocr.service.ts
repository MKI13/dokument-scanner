import Tesseract from 'tesseract.js';

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
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            console.log(`OCR Progress: ${progress}%`);
            onProgress?.(progress);
          }
        }
      });

      // OCR durchführen
      const { data } = await worker.recognize(file);
      await worker.terminate();

      console.log('✅ OCR ABGESCHLOSSEN');
      console.log('📄 Text:', data.text.substring(0, 200) + '...');
      console.log('🎯 Confidence:', data.confidence);

      // Text extrahieren und parsen
      const result: OCRResult = {
        text: data.text,
        confidence: Math.round(data.confidence),
        customer: this.extractCustomer(data.text),
        amount: this.extractAmount(data.text),
        date: this.extractDate(data.text)
      };

      console.log('📊 EXTRAHIERTE DATEN:', result);

      return result;

    } catch (error) {
      console.error('❌ OCR FEHLER:', error);
      
      // Fallback: Keine OCR-Daten
      return {
        text: '',
        confidence: 0,
        customer: null,
        amount: null,
        date: new Date()
      };
    }
  }

  private extractCustomer(text: string): string | null {
    // Suche nach typischen Kundennamen-Patterns
    const patterns = [
      /(?:Kunde|Customer|Name|Firma|Company)[:\s]+([A-ZÄÖÜ][a-zäöüß\s]+(?:[A-ZÄÖÜ][a-zäöüß]+)?)/i,
      /^([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/m,
      /Rechnung\s+(?:an|für)[:\s]+([A-ZÄÖÜ][a-zäöüß\s]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const customer = match[1].trim();
        if (customer.length > 2 && customer.length < 50) {
          console.log('👤 Kunde gefunden:', customer);
          return customer;
        }
      }
    }

    return null;
  }

  private extractAmount(text: string): number | null {
    // Suche nach Geldbeträgen
    const patterns = [
      /(?:Summe|Total|Betrag|Gesamt|Amount)[:\s]*€?\s*([\d.,]+)\s*€?/i,
      /€\s*([\d.,]+)/,
      /([\d.,]+)\s*€/,
      /(?:EUR|EURO)\s*([\d.,]+)/i,
      /([\d]+[.,]\d{2})\s*(?:EUR|€)/
    ];

    const amounts: number[] = [];

    for (const pattern of patterns) {
      const matches = text.matchAll(new RegExp(pattern, 'gi'));
      for (const match of matches) {
        if (match[1]) {
          const cleaned = match[1].replace(/\./g, '').replace(',', '.');
          const amount = parseFloat(cleaned);
          if (!isNaN(amount) && amount > 0 && amount < 1000000) {
            amounts.push(amount);
          }
        }
      }
    }

    if (amounts.length > 0) {
      // Nimm den größten Betrag (meist der Gesamtbetrag)
      const maxAmount = Math.max(...amounts);
      console.log('💰 Betrag gefunden:', maxAmount, '€');
      return maxAmount;
    }

    return null;
  }

  private extractDate(text: string): Date | null {
    // Deutsche Datumsformate
    const patterns = [
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,  // DD.MM.YYYY
      /(\d{1,2})\.(\d{1,2})\.(\d{2})/,  // DD.MM.YY
      /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
      /(?:Datum|Date)[:\s]+(\d{1,2})\.(\d{1,2})\.(\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let day, month, year;
        
        if (pattern.toString().includes('YYYY-MM-DD')) {
          [, year, month, day] = match;
        } else {
          [, day, month, year] = match;
        }

        year = year.length === 2 ? '20' + year : year;
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(date.getTime())) {
          console.log('📅 Datum gefunden:', date.toLocaleDateString('de-DE'));
          return date;
        }
      }
    }

    return null;
  }
}

export const ocrService = new OCRService();
