// Verbesserte OCR-Extraktion für deutsche Rechnungen

export function extractCustomerImproved(text: string): string | null {
  console.log('🔍 Suche Kunde (verbessert)');
  console.log('📄 Text Länge:', text.length, 'Zeichen');
  console.log('📄 Erste 400 Zeichen:', text.substring(0, 400));

  // Normalisiere Text für bessere Erkennung
  const normalizedText = text
    .replace(/\s+/g, ' ')  // Mehrfache Leerzeichen
    .replace(/\n+/g, '\n'); // Mehrfache Zeilenumbrüche

  // 1. PRIORITÄT: Bekannte deutsche Handelsketten und Firmen (ZUERST prüfen!)
  const knownChains = [
    'HAGEBAUMARKT', 'HAGEBAU', 'HORNBACH', 'BAUHAUS', 'OBI', 'TOOM',
    'ALDI', 'LIDL', 'REWE', 'EDEKA', 'PENNY', 'NETTO', 'KAUFLAND',
    'MERCEDES', 'BMW', 'VOLKSWAGEN', 'VW', 'AUDI', 'OPEL',
    'SHELL', 'ARAL', 'JET', 'ESSO', 'TOTAL', 'ENI',
    'DM', 'ROSSMANN', 'MÜLLER', 'DROGERIEM',
    'ATU', 'PITSTOP',
    'FINANZAMT', 'GEWERBE', 'KLARNA', 'PAYPAL',
    'AMAZON', 'EBAY', 'ZALANDO', 'OTTO', 'MEDIAMARKT', 'SATURN'
  ];

  for (const chain of knownChains) {
    const chainPattern = new RegExp(`\\b${chain}`, 'gi');
    if (chainPattern.test(normalizedText)) {
      // Nur den Hauptnamen nehmen (keine Zusätze wie "GmbH", "Markt", etc.)
      const cleaned = chain.charAt(0).toUpperCase() + chain.slice(1).toLowerCase();
      console.log('✅ Bekannte Kette gefunden:', cleaned);
      return cleaned;
    }
  }

  // 2. PRIORITÄT: Firmen mit Rechtsform (GmbH, AG, UG, etc.)
  const companyPatterns = [
    // Nur das ERSTE Wort vor der Rechtsform (kein langer Name)
    /\b([A-ZÄÖÜ][a-zäöüß]{2,})\s+(?:GmbH|AG|UG|KG|OHG|GbR|e\.?K\.?|mbH)/gi,
    // Grossbuchstaben + Rechtsform
    /\b([A-ZÄÖÜ]{3,})\s+(?:GMBH|AG|UG|KG|OHG)/gi,
  ];

  for (const pattern of companyPatterns) {
    const matches = Array.from(normalizedText.matchAll(pattern));
    for (const match of matches) {
      let company = match[1].trim();

      // Entferne "Rechnung" am Anfang
      company = company.replace(/^RECHNUNG\s+/i, '');

      // Ignoriere bekannte Fehlerkennungen
      if (!company.match(/^(RECHNUNG|INVOICE|DATUM|NUMMER)/i) && company.length >= 3) {
        console.log('✅ Firma gefunden (Rechtsform):', company);
        return company;
      }
    }
  }

  // 3. PRIORITÄT: Firmenname aus Website/Email
  const websitePattern = /(?:www\s*\.\s*|https?:\/\/)([a-zäöü0-9-]+)\s*\.\s*(de|com|net)/gi;
  const emailPattern = /[\w.-]+@([a-zäöü0-9-]+)\.(de|com|net)/gi;

  const websiteMatches = Array.from(normalizedText.matchAll(websitePattern));
  for (const match of websiteMatches) {
    const domain = match[1].toLowerCase();
    if (!['gmail', 'yahoo', 'web', 'mail', 'info', 'email', 'online'].includes(domain)) {
      const company = domain.charAt(0).toUpperCase() + domain.slice(1);
      console.log('✅ Firma von Website:', company);
      return company;
    }
  }

  const emailMatches = Array.from(normalizedText.matchAll(emailPattern));
  for (const match of emailMatches) {
    const domain = match[1].toLowerCase();
    if (!['gmail', 'yahoo', 'web', 'mail', 'info', 'email', 'online'].includes(domain)) {
      const company = domain.charAt(0).toUpperCase() + domain.slice(1);
      console.log('✅ Firma von Email:', company);
      return company;
    }
  }

  // 4. PRIORITÄT: "RECHNUNG AN:" oder "Rechnungsempfänger"
  const recipientPatterns = [
    /(?:RECHNUNG\s+AN|RECHNUNGSEMPF[AÄ]NGER|KUNDE|CUSTOMER|BILL\s+TO)[\s:]+([A-ZÄÖÜ][a-zäöüß\s-]{3,40})(?=\n|$)/gi,
  ];

  for (const pattern of recipientPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      let customer = match[1].trim();

      // Entferne "Rechnung" am Anfang
      customer = customer.replace(/^RECHNUNG\s+/i, '');

      // Entferne Straßenadressen und Nummern
      customer = customer.replace(/\s+\d+.*$/, '').trim();

      // Nur erstes Wort nehmen (Firmenname)
      customer = customer.split(/\s+/)[0];

      // Mindestlänge
      if (customer.length >= 3 && customer.length <= 40) {
        console.log('✅ Kunde von Rechnung-Feld:', customer);
        return customer;
      }
    }
  }

  // 5. PRIORITÄT: Firmenname am Anfang des Dokuments (erste 5 Zeilen)
  const firstLines = normalizedText.split('\n').slice(0, 5).join('\n');
  const companyAtTopPattern = /^([A-ZÄÖÜ][a-zäöüß]+(?: [A-ZÄÖÜ][a-zäöüß]+){0,2})/m;
  const topMatch = firstLines.match(companyAtTopPattern);

  if (topMatch && topMatch[1]) {
    let company = topMatch[1].trim();

    // Entferne "Rechnung" am Anfang
    company = company.replace(/^RECHNUNG\s+/i, '');

    // Nur erstes Wort wenn mehrere Wörter
    const words = company.split(/\s+/);
    if (words.length > 1) {
      company = words[0];
    }

    const ignoreList = ['RECHNUNG', 'INVOICE', 'DATUM', 'DATE', 'NUMMER', 'NUMBER'];

    if (company.length >= 3 && !ignoreList.some(word => company.includes(word))) {
      console.log('✅ Firma am Dokumentanfang:', company);
      return company;
    }
  }

  // 6. Fallback: Erster Eigenname in Großbuchstaben (> 3 Zeichen)
  const namePattern = /\b([A-ZÄÖÜ]{3,})\b/g;
  const nameMatches = Array.from(normalizedText.matchAll(namePattern));

  const ignoreWords = [
    'RECHNUNG', 'INVOICE', 'DATUM', 'DATE', 'NUMMER', 'NUMBER',
    'EUR', 'EURO', 'BRUTTO', 'NETTO', 'MWST', 'UST',
    'SUMME', 'TOTAL', 'BETRAG', 'AMOUNT', 'GESAMT',
    'JANUAR', 'FEBRUAR', 'MARZ', 'APRIL', 'MAI', 'JUNI',
    'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER',
    'STRASSE', 'STR', 'PLZ', 'ORT', 'STADT', 'VON', 'VOM', 'AN', 'BEI'
  ];

  for (const match of nameMatches) {
    const name = match[1].trim();
    if (!ignoreWords.some(word => name.includes(word)) && name.length >= 3) {
      // Title Case (nur erstes Wort)
      const titleCase = name.charAt(0) + name.slice(1).toLowerCase();
      console.log('✅ Firma (Fallback):', titleCase);
      return titleCase;
    }
  }

  console.log('❌ Kein Kunde gefunden');
  return null;
}

export function extractDateImproved(text: string): Date | null {
  console.log('🔍 Suche Datum (verbessert)');

  // Normalisiere Text
  const normalized = text.replace(/\s+/g, ' ');

  // Deutsche Datumsformate
  const datePatterns = [
    // DD.MM.YYYY oder DD.MM.YY
    {
      pattern: /(?:DATUM|RECHNUNGSDATUM|DATE|VOM)[\s:]+(\d{1,2})\.(\d{1,2})\.(\d{2,4})/i,
      format: 'dmy'
    },
    {
      pattern: /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/,
      format: 'dmy'
    },
    {
      pattern: /\b(\d{1,2})\.(\d{1,2})\.(\d{2})\b/,
      format: 'dmy'
    },
    // Monat ausgeschrieben: "15. Januar 2025"
    {
      pattern: /(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/i,
      format: 'month'
    },
    // ISO-Format: YYYY-MM-DD
    {
      pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/,
      format: 'ymd'
    }
  ];

  for (const { pattern, format } of datePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      let day, month, year;

      if (format === 'dmy') {
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      } else if (format === 'ymd') {
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else if (format === 'month') {
        day = parseInt(match[1]);
        year = parseInt(match[3]);

        const months = ['januar', 'februar', 'märz', 'april', 'mai', 'juni',
                       'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
        month = months.indexOf(match[2].toLowerCase()) + 1;
      }

      // 2-stelliges Jahr zu 4-stellig
      if (year! < 100) {
        year = year! < 50 ? 2000 + year! : 1900 + year!;
      }

      // Validiere Datum
      if (day! >= 1 && day! <= 31 && month! >= 1 && month! <= 12 && year! >= 1900 && year! <= 2100) {
        const date = new Date(year!, month! - 1, day!);

        // Prüfe ob Datum gültig ist
        if (!isNaN(date.getTime())) {
          console.log('✅ Datum gefunden:', date.toLocaleDateString('de-DE'));
          return date;
        }
      }
    }
  }

  console.log('⚠️ Kein Datum gefunden - verwende heutiges Datum');
  return new Date();
}

export function extractAmountImproved(text: string): number | null {
  console.log('🔍 Suche Betrag (verbessert)');
  console.log('📄 Text Länge:', text.length, 'Zeichen');

  // Normalisiere Text - OCR erkennt € manchmal als C, e, o, etc.
  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/[Cc©€eE]\s*(?=\d)/g, '€ ')  // C/e/E vor Zahl → €
    .replace(/(\d)\s*[Cc©€eE]/g, '$1 €')  // C/e/E nach Zahl → €
    .replace(/[oO0]\s*(?=\d)/g, '€ ');  // O vor Zahl → €

  console.log('🔍 Normalisierter Text (erste 500 Zeichen):', normalized.substring(0, 500));

  // Deutsche Betragsformate mit verschiedenen Schlüsselwörtern - SEHR AGGRESSIV
  const amountPatterns = [
    // PRIORITÄT 1: Mit klaren Schlüsselwörtern
    /(?:SUMME|GESAMT|TOTAL|ENDBETRAG|BETRAG|RECHNUNGSBETRAG|RECHNUNGSBET|AMOUNT|SUM|BRUTTO|NETTO|SALDO)[\s:*€CcOoeE-]*([0-9]{1,}[.,]\d{2})/gi,

    // PRIORITÄT 2: "Zu zahlen", "Fällig"
    /(?:ZU\s+ZAHLEN|ZAHLBAR|F[ÄA]LLIG|ZAHLUNG|PAY|PAYABLE)[\s:*€CcOoeE-]*([0-9]{1,}[.,]\d{2})/gi,

    // PRIORITÄT 3: "123,45 EUR/€/C/e" - mit Währung dahinter
    /([0-9]{1,}[.,]\d{2})\s*(?:EUR|€|C|c|e|E)(?:\s|$|[^0-9])/gi,

    // PRIORITÄT 4: "EUR/€/C 123,45" - Währung davor
    /(?:EUR|€|C|e|E)\s*([0-9]{1,}[.,]\d{2})/gi,

    // PRIORITÄT 5: Beträge mit Tausenderpunkt "1.234,56"
    /([0-9]{1,3}(?:\.[0-9]{3})+,[0-9]{2})\b/g,

    // PRIORITÄT 6: Beliebiger Betrag mit Komma "XX,XX"
    /\b([0-9]{2,},[0-9]{2})\b/g,

    // PRIORITÄT 7: Betrag mit Punkt "XX.XX" (englisches Format - nur falls nichts anderes)
    /\b([0-9]{2,}\.[0-9]{2})\b/g
  ];

  const foundAmounts: { amount: number; priority: number }[] = [];

  amountPatterns.forEach((pattern, priority) => {
    const matches = Array.from(normalized.matchAll(pattern));
    console.log(`Pattern ${priority + 1}: Gefunden ${matches.length} Treffer`);

    for (const match of matches) {
      if (match[1]) {
        // Konvertiere deutsches Format zu Zahl
        let cleaned = match[1]
          .replace(/\./g, '')  // Tausenderpunkte entfernen
          .replace(',', '.');  // Komma zu Punkt

        const amount = parseFloat(cleaned);

        // Validiere Betrag (zwischen 0,01 und 1.000.000)
        if (!isNaN(amount) && amount >= 0.01 && amount <= 1000000) {
          console.log(`  ✓ Kandidat: ${amount.toFixed(2)} EUR (Priorität ${priority + 1})`);
          foundAmounts.push({ amount, priority });
        }
      }
    }
  });

  if (foundAmounts.length > 0) {
    // Sortiere nach Priorität (niedrigere Nummer = höhere Priorität)
    foundAmounts.sort((a, b) => a.priority - b.priority);

    // Nehme die Beträge mit höchster Priorität
    const highestPriority = foundAmounts[0].priority;
    const topPriorityAmounts = foundAmounts
      .filter(a => a.priority === highestPriority)
      .map(a => a.amount);

    // Von den top Priorität-Beträgen nehme den größten
    const maxAmount = Math.max(...topPriorityAmounts);
    console.log(`✅ BETRAG GEFUNDEN: ${maxAmount.toFixed(2)} EUR (Priorität ${highestPriority + 1}, aus ${foundAmounts.length} Kandidaten)`);
    return maxAmount;
  }

  console.log('⚠️ KEIN BETRAG GEFUNDEN - prüfe OCR Text!');
  return null;
}
