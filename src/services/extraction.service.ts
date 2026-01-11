/**
 * EXTRACTION v3.2 - DATEINAME: DATUM_FIRMA_BETRAG
 */

interface ExtractionResult {
  customer: string | null;
  date: Date | null;
  amount: number | null;
  confidence: { customer: number; date: number; amount: number; };
}

class ExtractionService {
  
  extractAll(text: string): ExtractionResult {
    return {
      customer: this.extractCustomer(text),
      date: this.extractDate(text),
      amount: this.extractAmount(text),
      confidence: { customer: 0, date: 0, amount: 0 }
    };
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * KUNDEN-EXTRAKTION
   * ═══════════════════════════════════════════════════════════════
   */
  extractCustomer(text: string): string | null {
    if (!text) return null;
    
    console.log('\n🔍 KUNDE');
    
    // Website
    const websitePattern = /(?:www\s*\.\s*|https?:\/\/)([\w\s-]+?)\s*\.\s*(de|com|net|org|eu|at|ch)/gi;
    const matches = Array.from(text.matchAll(websitePattern));
    
    for (const match of matches) {
      const domain = match[1].replace(/\s+/g, '');
      if (domain.length > 3 && !['gmail', 'yahoo', 'web', 'mail', 'info'].includes(domain.toLowerCase())) {
        const cleaned = domain.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        console.log('✅ Website:', cleaned);
        return cleaned;
      }
    }
    
    // Email
    const emailPattern = /[\w\.-]+@([\w-]+)\.(de|com|net)/gi;
    const emailMatches = Array.from(text.matchAll(emailPattern));
    
    for (const match of emailMatches) {
      const domain = match[1];
      if (domain.length > 3 && !['gmail', 'yahoo', 'web', 'mail'].includes(domain.toLowerCase())) {
        const cleaned = domain.charAt(0).toUpperCase() + domain.slice(1);
        console.log('✅ Email:', cleaned);
        return cleaned;
      }
    }
    
    // Fallback
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    for (const line of lines.slice(0, 5)) {
      if (/[a-zA-Z]{3,}/.test(line) && !line.match(/\d{2}[\.\/]\d{2}/) && !line.toLowerCase().includes('datum')) {
        console.log('✅ Fallback:', line);
        return line;
      }
    }
    
    console.log('❌ Kein Kunde');
    return null;
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * DATUMS-EXTRAKTION
   * ═══════════════════════════════════════════════════════════════
   */
  extractDate(text: string): Date | null {
    if (!text) return null;
    
    console.log('\n📅 DATUM');
    
    const foundDates: Array<{ date: Date; confidence: number; source: string }> = [];
    
    const contextPatterns = [
      { regex: /(?:Rechnung(?:sdatum)?|Invoice\s*Date)[\s:]+(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/gi, conf: 100 },
      { regex: /(?:Datum|Date)[\s:]+(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/gi, conf: 95 },
      { regex: /(?:Bon-Nr\.|Beleg)[\s\S]{0,100}?(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})/gi, conf: 90 },
      { regex: /datum.*?(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})/gi, conf: 90 },
    ];
    
    for (const { regex, conf } of contextPatterns) {
      const matches = text.matchAll(regex);
      for (const match of matches) {
        const date = this.parseDate(match[1], match[2], match[3]);
        if (date) {
          foundDates.push({ date, confidence: conf, source: match[0] });
        }
      }
    }
    
    const twoDigit = /\b(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2})\b/g;
    const twoMatches = text.matchAll(twoDigit);
    
    for (const match of twoMatches) {
      const date = this.parseDate(match[1], match[2], match[3]);
      if (date) {
        foundDates.push({ date, confidence: 75, source: match[0] });
      }
    }
    
    if (foundDates.length === 0) {
      console.log('❌ Kein Datum');
      return null;
    }
    
    foundDates.sort((a, b) => b.confidence - a.confidence);
    
    const best = foundDates[0];
    console.log('✅ Datum:', this.formatDate(best.date));
    
    return best.date;
  }
  
  private parseDate(day: string, month: string, year: string): Date | null {
    const d = parseInt(day);
    const m = parseInt(month);
    let y = parseInt(year);
    
    if (y < 100) {
      y = y >= 50 ? 1900 + y : 2000 + y;
    }
    
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1990 && y <= 2050) {
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      if (date.getUTCDate() === d && date.getUTCMonth() === m - 1) {
        return date;
      }
    }
    
    return null;
  }
  
  private formatDate(date: Date): string {
    const d = String(date.getUTCDate()).padStart(2, '0');
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}.${m}.${y}`;
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * BETRAGS-EXTRAKTION
   * ═══════════════════════════════════════════════════════════════
   */
  extractAmount(text: string): number | null {
    if (!text) return null;
    
    console.log('\n💰 BETRAG');
    
    const amounts: Array<{ amount: number; priority: number; conf: number; source: string }> = [];
    
    // KUNDENBELEG
    const kundenbelegMatch = text.match(/KUNDENBELEG[\s\S]{0,500}?Betrag[\s:]*(\d[\d\.,]*)\s*(?:EUR|€)/i);
    
    if (kundenbelegMatch) {
      const amount = this.parseAmount(kundenbelegMatch[1]);
      if (amount && amount > 0.01 && amount < 100000) {
        amounts.push({ amount, priority: 1500, conf: 100, source: kundenbelegMatch[0] });
        console.log(`   🎯 KUNDENBELEG:`, amount.toFixed(2));
      }
    }
    
    // Kartenzahlung
    const kartenMatch = text.match(/Kartenzahlung[\s\S]{0,300}?Betrag[\s:]*(\d[\d\.,]*)\s*(?:EUR|€)/i);
    
    if (kartenMatch) {
      const amount = this.parseAmount(kartenMatch[1]);
      if (amount && amount > 0.01 && amount < 100000) {
        amounts.push({ amount, priority: 1500, conf: 100, source: kartenMatch[0] });
        console.log(`   🎯 KARTE:`, amount.toFixed(2));
      }
    }
    
    // Gesamtbetrag
    const gesamtbetragPattern = /Gesamtbetrag[\s:]*(\d[\d\.,]*)\s*(?:EUR|€)/gi;
    const gesamtMatches = text.matchAll(gesamtbetragPattern);
    
    for (const match of gesamtMatches) {
      const amount = this.parseAmount(match[1]);
      if (amount && amount > 0.01 && amount < 100000) {
        amounts.push({ amount, priority: 1400, conf: 98, source: match[0] });
        console.log(`   💳 GESAMT:`, amount.toFixed(2));
      }
    }
    
    // Rechnungsbetrag
    const rechnungPattern = /(?:Rechnungs?betrag|Invoice|Endbetrag)[\s:]*(?:EUR)?\s*([\d\.,]+)\s*(?:EUR|€)?/gi;
    const rechnungMatches = text.matchAll(rechnungPattern);
    
    for (const match of rechnungMatches) {
      const amount = this.parseAmount(match[1]);
      if (amount && amount > 0.01 && amount < 100000) {
        amounts.push({ amount, priority: 1000, conf: 95, source: match[0] });
        console.log(`   📄 RECHNUNG:`, amount.toFixed(2));
      }
    }
    
    // Summe
    const summePattern = /(?:Summe|Gesamt|Total)[\s:]*(?:EUR)?\s*([\d\.,]+)\s*(?:EUR|€)?/gi;
    const summeMatches = text.matchAll(summePattern);
    
    for (const match of summeMatches) {
      if (/Gesamtbetrag/i.test(match[0])) continue;
      
      const context = text.substring(Math.max(0, match.index! - 100), Math.min(text.length, match.index! + 100));
      
      if (/skonto|rabatt/i.test(context)) {
        console.log(`   ⚠️ Skip (Skonto)`);
        continue;
      }
      
      const amount = this.parseAmount(match[1]);
      if (amount && amount > 0.01 && amount < 100000) {
        amounts.push({ amount, priority: 900, conf: 90, source: match[0] });
        console.log(`   📊 SUMME:`, amount.toFixed(2));
      }
    }
    
    if (amounts.length === 0) {
      console.log('❌ Kein Betrag');
      return null;
    }
    
    amounts.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.amount - a.amount;
    });
    
    const best = amounts[0];
    console.log('✅ Betrag:', best.amount.toFixed(2), '€');
    
    return best.amount;
  }
  
  private parseAmount(amountStr: string): number | null {
    let cleaned = amountStr.replace(/EUR|€/gi, '').trim();
    
    const dotCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;
    
    if (commaCount > 0 && dotCount > 0) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (commaCount > 0) {
      cleaned = cleaned.replace(',', '.');
    }
    
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : amount;
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * DATEINAME-GENERATOR - NEUE REIHENFOLGE!
   * FORMAT: YYYY-MM-DD_Firmenname_BETRAG,XXEUR.jpg
   * ═══════════════════════════════════════════════════════════════
   */
  generateFilename(customer: string | null, date: Date, amount: number | null, ext: string): string {
    const parts: string[] = [];
    
    // 1️⃣ DATUM ZUERST (ISO-Format: YYYY-MM-DD)
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    parts.push(`${y}-${m}-${d}`);
    
    // 2️⃣ FIRMENNAME
    if (customer) {
      const sanitized = customer
        .substring(0, 30)
        .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
        .replace(/\s+/g, '_')
        .trim();
      
      if (sanitized) {
        parts.push(sanitized);
      } else {
        parts.push('Unbekannt');
      }
    } else {
      parts.push('Unbekannt');
    }
    
    // 3️⃣ BETRAG
    if (amount && amount > 0) {
      const amountStr = amount.toFixed(2).replace('.', ',') + 'EUR';
      parts.push(amountStr);
    }
    
    const filename = parts.join('_') + '.' + ext;
    
    console.log('📝 Dateiname:', filename);
    
    return filename;
  }
}

export const extractionService = new ExtractionService();
