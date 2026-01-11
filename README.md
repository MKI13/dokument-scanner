# Dokument Scanner App

Lokale Dokumenten-Scanner PWA mit OCR-Texterkennung, komplett ohne Server oder API Keys.

## Features

✅ **Lokale OCR mit Tesseract.js**
- Deutsche Texterkennung
- Funktioniert komplett offline
- Keine API Keys benötigt
- Kein Server notwendig

✅ **PDF & Bild Support**
- PDFs mit eingebettetem Text
- Gescannte PDFs (OCR)
- Alle gängigen Bildformate (JPG, PNG, etc.)

✅ **Intelligente Extraktion**
- Automatische Datumserkennung
- Kundennamen-Extraktion
- Dokumenttyp-Erkennung (Rechnung, Lieferschein, Angebot)
- Tags und Kategorisierung

✅ **Flexible Ansichten**
- Nach Monat gruppiert
- Nach Kunde sortiert
- Listenansicht mit Suche
- Volltextsuche über alle Dokumente

✅ **Performance-Optimiert**
- Web Worker für OCR (UI bleibt responsiv)
- Bild-Kompression
- IndexedDB für schnellen Zugriff
- Thumbnail-Generierung
- PWA für Offline-Nutzung

## Installation

### 1. Dependencies installieren

```bash
cd dokument-scanner
npm install
```

### 2. Development Server starten

```bash
npm run dev
```

Die App läuft jetzt auf: **http://localhost:9000**

### 3. Production Build

```bash
npm run build
npm run preview
```

## Nutzung

### Dokumente hochladen

1. Klicke auf "Hochladen" Button
2. Wähle Dateien aus oder ziehe sie per Drag & Drop
3. Die App verarbeitet automatisch:
   - OCR Texterkennung
   - Datum-Extraktion
   - Kunden-Erkennung
   - Dokumenttyp-Klassifizierung

### Ansichten

**Nach Monat**
- Dokumente gruppiert nach Monat
- Chronologisch sortiert (neueste zuerst)

**Nach Kunde**
- Dokumente gruppiert nach erkanntem Kunden
- Alphabetisch sortiert

**Alle Dokumente**
- Vollständige Liste
- Suchfunktion
- Sortierung nach Datum, Name, Kunde

### Dokument bearbeiten

1. Klicke auf Dokument
2. Klicke auf "Bearbeiten"
3. Passe Metadaten an:
   - Datum
   - Kunde
   - Typ
   - Tags
   - Notizen

### Suche

Die Volltextsuche durchsucht:
- Dateiname
- Erkannter Text (OCR)
- Kundenname
- Notizen
- Tags

## Technologie-Stack

- **Frontend**: React 18 + TypeScript
- **Bundler**: Vite
- **OCR**: Tesseract.js (Deutsch)
- **PDF**: PDF.js (Mozilla)
- **Datenbank**: Dexie.js (IndexedDB)
- **Kompression**: browser-image-compression
- **PWA**: vite-plugin-pwa
- **Icons**: Lucide React
- **Datums**: date-fns

## Projektstruktur

```
src/
├── components/
│   ├── Upload/
│   │   ├── FileUploader.tsx         # Drag & Drop Upload
│   │   └── OCRProgress.tsx          # Fortschrittsanzeige
│   ├── Views/
│   │   ├── MonthView.tsx            # Nach Monat gruppiert
│   │   ├── CustomerView.tsx         # Nach Kunde gruppiert
│   │   └── ListView.tsx             # Alle Dokumente
│   └── Document/
│       ├── DocumentCard.tsx         # Thumbnail + Info
│       ├── DocumentDetail.tsx       # Vollansicht
│       └── DocumentEditor.tsx       # Metadaten bearbeiten
├── services/
│   ├── ocr.service.ts               # Tesseract Integration
│   ├── pdf.service.ts               # PDF.js Wrapper
│   ├── database.service.ts          # Dexie DB
│   ├── extraction.service.ts        # Intelligente Extraktion
│   ├── compression.service.ts       # Bild-Kompression
│   └── document.service.ts          # Hauptlogik
├── types/
│   └── index.ts                     # TypeScript Interfaces
├── App.tsx                          # Haupt-App
├── App.css                          # Styling
└── main.tsx                         # Entry Point
```

## Performance-Tipps

### OCR-Geschwindigkeit
- Kleine Dateien (< 2MB): ~3-5 Sekunden
- Große Dateien (> 5MB): ~10-15 Sekunden
- PDFs: Je nach Seitenanzahl

### Speicher
- Dokumente werden komprimiert gespeichert
- Thumbnails mit reduzierter Auflösung
- IndexedDB hat praktisch unbegrenzten Speicher

### Offline-Fähigkeit
- Alle Funktionen funktionieren offline
- Tesseract Sprachmodell wird beim ersten Start geladen
- Danach komplett offline nutzbar

## Browser-Kompatibilität

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile Browser (iOS Safari, Chrome Android)

**Benötigt:**
- IndexedDB Support
- Web Workers
- File API
- Canvas API

## Datenschutz

🔒 **100% Lokal**
- Keine Daten verlassen deinen Computer
- Kein Server
- Keine Cloud
- Keine Tracking
- Alle Daten in IndexedDB (Browser)

## Bekannte Einschränkungen

- OCR-Qualität abhängig von Bildqualität
- Deutsche Texterkennung optimiert
- Handschrift-Erkennung limitiert
- Sehr große PDFs (>50 Seiten) können langsam sein

## Troubleshooting

### OCR ist langsam
- Komprimiere Bilder vor Upload
- Nutze PDFs mit eingebettetem Text wenn möglich

### Datum wird nicht erkannt
- Prüfe ob Datum im Format DD.MM.YYYY vorhanden
- Bearbeite Dokument manuell

### Kunde wird nicht erkannt
- Firmenname sollte in Großbuchstaben oder mit "GmbH" sein
- Manuell nachtragen möglich

## Entwicklung

### Neue Features hinzufügen

1. Service erstellen in `src/services/`
2. Komponente erstellen in `src/components/`
3. In App.tsx integrieren

### Debugging

```bash
# Browser DevTools öffnen
# Rechtsklick -> Untersuchen
# Application -> IndexedDB -> DocumentScanner
```

## Lizenz

MIT - Frei verwendbar für private und kommerzielle Projekte

## Support

Bei Fragen oder Problemen:
1. Browser Console prüfen
2. IndexedDB Daten prüfen
3. Issue auf GitHub erstellen

---

**Made with ❤️ by ef-sin Schreinerei**
