/**
 * DEUTSCHES WÖRTERBUCH FÜR OCR-KORREKTUR
 */

interface DictionaryEntry {
  word: string;
  category: 'company' | 'payment' | 'document' | 'amount' | 'general';
  weight: number;
}

class DictionaryService {
  
  private readonly dictionary: DictionaryEntry[] = [
    // FIRMEN & RECHTSFORMEN
    { word: 'GmbH', category: 'company', weight: 10 },
    { word: 'PROSOL', category: 'company', weight: 10 },
    { word: 'ENI', category: 'company', weight: 10 },
    { word: 'Shell', category: 'company', weight: 10 },
    { word: 'Aral', category: 'company', weight: 10 },
    
    // ZAHLUNGSMITTEL
    { word: 'Kartenzahlung', category: 'payment', weight: 10 },
    { word: 'girocard', category: 'payment', weight: 10 },
    
    // DOKUMENT-TYPEN
    { word: 'Rechnung', category: 'document', weight: 10 },
    { word: 'Beleg', category: 'document', weight: 10 },
    
    // BETRÄGE
    { word: 'Betrag', category: 'amount', weight: 10 },
    { word: 'Summe', category: 'amount', weight: 10 },
    { word: 'EUR', category: 'amount', weight: 10 },
  ];
  
  /**
   * LEVENSHTEIN DISTANCE
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase() ? 0 : 1;
        
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    return matrix[len1][len2];
  }
  
  /**
   * ÄHNLICHKEIT
   */
  private similarity(s1: string, s2: string): number {
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 100;
    
    const distance = this.levenshteinDistance(s1, s2);
    return ((maxLen - distance) / maxLen) * 100;
  }
  
  /**
   * FINDE ÄHNLICHE WÖRTER
   */
  findSimilar(word: string, minSimilarity = 70, maxResults = 5): Array<{ word: string; similarity: number; category: string }> {
    if (!word || word.length < 3) return [];
    
    const results: Array<{ word: string; similarity: number; category: string; weight: number }> = [];
    
    for (const entry of this.dictionary) {
      const sim = this.similarity(word, entry.word);
      
      if (sim >= minSimilarity) {
        results.push({
          word: entry.word,
          similarity: sim,
          category: entry.category,
          weight: entry.weight
        });
      }
    }
    
    results.sort((a, b) => {
      const scoreA = a.similarity * (a.weight / 10);
      const scoreB = b.similarity * (b.weight / 10);
      return scoreB - scoreA;
    });
    
    return results.slice(0, maxResults).map(r => ({
      word: r.word,
      similarity: r.similarity,
      category: r.category
    }));
  }
  
  /**
   * TEXT KORRIGIEREN
   */
  correctText(text: string): { original: string; corrected: string; corrections: Array<{ from: string; to: string; confidence: number }> } {
    const words = text.split(/\s+/);
    const corrections: Array<{ from: string; to: string; confidence: number }> = [];
    const correctedWords: string[] = [];
    
    for (const word of words) {
      if (word.length < 3) {
        correctedWords.push(word);
        continue;
      }
      
      const similar = this.findSimilar(word, 75, 1);
      
      if (similar.length > 0 && similar[0].similarity < 100) {
        const correction = similar[0];
        corrections.push({
          from: word,
          to: correction.word,
          confidence: correction.similarity
        });
        correctedWords.push(correction.word);
        console.log(`🔧 Korrektur: "${word}" → "${correction.word}" (${correction.similarity.toFixed(0)}%)`);
      } else {
        correctedWords.push(word);
      }
    }
    
    return {
      original: text,
      corrected: correctedWords.join(' '),
      corrections
    };
  }
}

export const dictionaryService = new DictionaryService();
