import * as Tesseract from 'tesseract.js';

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
    console.log('🔍 Suche Kunde in:', text.substring(0, 200));

    // Website Pattern (www.FIRMA.de → FIRMA)
    const websitePattern = /(?:www\s*\.\s*|https?:\/\/)([\w-]+)\s*\.\s*(de|com|net|org|eu|at|ch|fr|gr)/gi;
    const websiteMatches = Array.from(text.matchAll(websitePattern));

    for (const match of websiteMatches) {
      const domain = match[1].toLowerCase();

      if (!['gmail', 'yahoo', 'web', 'mail', 'info', 'email'].includes(domain)) {
        const customer = domain.charAt(0).toUpperCase() + domain.slice(1);
        console.log('✅ Kunde von Website:', customer);
        return customer;
      }
    }

    // Email Pattern
    const emailPattern = /[\w.-]+@([\w-]+)\.(de|com|net|org)/gi;
    const emailMatches = Array.from(text.matchAll(emailPattern));

    for (const match of emailMatches) {
      const domain = match[1].toLowerCase();

      if (!['gmail', 'yahoo', 'web', 'mail', 'info'].includes(domain)) {
        const customer = domain.charAt(0).toUpperCase() + domain.slice(1);
        console.log('✅ Kunde von Email:', customer);
        return customer;
      }
    }

    // RECHNUNG AN: Name in nächster Zeile (typisches Rechnungsformat)
    const rechnungAnPattern = /RECHNUNG\s+AN:\s*(?:RECHNUNG\s+NR[.\s\d]*)?[\r\n]+(?:\d{1,2}\.\s*[A-Z]+\s*\d{4}[\r\n]+)?([A-ZÄÖÜ]+(?:\s+[A-ZÄÖÜ]+)+)/i;
    const rechnungMatch = text.match(rechnungAnPattern);
    if (rechnungMatch && rechnungMatch[1]) {
      const customer = rechnungMatch[1].trim();
      // Konvertiere zu Title Case (Vincent Vogelstetter)
      const titleCase = customer.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      console.log('✅ Kunde von Rechnung AN:', titleCase);
      return titleCase;
    }

    // Vollständiger Name in GROSSBUCHSTABEN (mindestens Vor- und Nachname)
    const fullNamePattern = /\b([A-ZÄÖÜ]{2,})\s+([A-ZÄÖÜ]{2,})\b/;
    const fullNameMatch = text.match(fullNamePattern);
    if (fullNameMatch) {
      const firstName = fullNameMatch[1];
      const lastName = fullNameMatch[2];

      // Ignoriere bekannte Nicht-Namen
      const ignoreList = ['RECHNUNG NR', 'APRIL', 'MAI', 'JUNI', 'JULI', 'JANUAR', 'FEBRUAR', 'MARZ', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER'];
      const fullName = `${firstName} ${lastName}`;

      if (!ignoreList.some(ignore => fullName.includes(ignore))) {
        // Konvertiere zu Title Case
        const titleCase = `${firstName.charAt(0)}${firstName.slice(1).toLowerCase()} ${lastName.charAt(0)}${lastName.slice(1).toLowerCase()}`;
        console.log('✅ Kunde (Vollständiger Name):', titleCase);
        return titleCase;
      }
    }

    // Firmenname Pattern
    const patterns = [
      /(?:Firma|Company|Kunde|Customer)[:\s]+([A-ZÄÖÜ][a-zäöüß\s]+(?:[A-ZÄÖÜ][a-zäöüß]+)?)/i,
      /^([A-ZÄÖÜ][a-zäöüß]+\s+(?:GmbH|AG|UG|KG|OHG))/m
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const customer = match[1].trim();
        if (customer.length > 2 && customer.length < 50 && !customer.includes('RECHNUNG')) {
          console.log('✅ Kunde gefunden:', customer);
          return customer;
        }
      }
    }

    console.log('❌ Kein Kunde gefunden');
    return null;
  }

  private extractAmount(text: string): number | null {
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
      const maxAmount = Math.max(...amounts);
      console.log('✅ Betrag gefunden:', maxAmount, '€');
      return maxAmount;
    }

    return null;
  }

  private extractDate(text: string): Date | null {
    const patterns = [
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      /(\d{1,2})\.(\d{1,2})\.(\d{2})/,
      /(\d{4})-(\d{2})-(\d{2})/,
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
          console.log('✅ Datum gefunden:', date.toLocaleDateString('de-DE'));
          return date;
        }
      }
    }

    return null;
  }
}

export const ocrService = new OCRService();
