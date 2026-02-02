# 📄 Dokument Scanner App

Lokale Dokumenten-Scanner PWA mit OCR-Texterkennung und GitHub Backup - komplett ohne Server oder API Keys.

**Entwickelt für [ef-sinn.de](https://ef-sinn.de)** - Professionelle Dokumentenverwaltung für Handwerksbetriebe.

---

## 🚀 Features

### ✅ Lokale OCR mit Tesseract.js
- **Deutsche Texterkennung** mit optimierten Patterns
- Funktioniert **komplett offline**
- **Keine API Keys** benötigt
- **Kein Server** notwendig
- Automatische Extraktion von:
  - **Brutto-Betrag** (Rechnungsbetrag)
  - **Datum** (Rechnungsdatum)
  - **Kundenname** (erster Name)

### ✅ GitHub Backup & Synchronisation
- **Automatisches Backup** zu GitHub Repository
- **Bidirektionale Synchronisation**
- **Versionierung** durch Git
- **Wiederherstellung** von jedem Gerät
- Speichert:
  - Alle Dokumente als Bilder (Jahr/Monat Struktur)
  - Metadaten als JSON (backup.json)
  - Vollständiger OCR-Text

### ✅ PDF & Bild Support
- PDFs mit eingebettetem Text
- Gescannte PDFs (OCR)
- Alle gängigen Bildformate (JPG, PNG, WebP, etc.)

### ✅ Intelligente Extraktion
- **Priorisierte Betrags-Erkennung:**
  1. BRUTTO (höchste Priorität)
  2. SUMME, GESAMT, TOTAL
  3. zu bezahlen, Rechnungsbetrag
  4. Netto (niedrigste Priorität - nur als Fallback)
- **Datumserkennung** mit 2→4-stelliger Jahreskonvertierung
- **Kundennamen-Extraktion** (nur erster Name für Gruppierung)
- Dokumenttyp-Erkennung (Rechnung, Lieferschein, Angebot)

### ✅ Flexible Ansichten
- **Nach Monat gruppiert** (chronologisch)
- **Nach Kunde sortiert** (alphabetisch)
- **Listenansicht** mit Suche
- **Volltextsuche** über alle Dokumente

### ✅ Performance-Optimiert
- Web Worker für OCR (UI bleibt responsiv)
- Bild-Kompression
- IndexedDB für schnellen Zugriff
- Thumbnail-Generierung
- PWA für Offline-Nutzung

---

## 🐧 Installation auf Linux Kubuntu

### Voraussetzungen

```bash
# Node.js und npm installieren (Version 18+)
sudo apt update
sudo apt install nodejs npm

# Version prüfen
node --version  # sollte v18+ sein
npm --version   # sollte 9+ sein
```

**Falls Node.js zu alt ist:**

```bash
# NodeSource Repository hinzufügen für neuere Version
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Alternativ: nvm (Node Version Manager) verwenden
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 1. Repository klonen

```bash
cd ~/Dokumente  # oder ein anderer Ordner
git clone https://github.com/MKI13/dokument-scanner.git
cd dokument-scanner
```

### 2. Dependencies installieren

```bash
npm install
```

**Mögliche Fehler:**

```bash
# Falls Berechtigungsfehler auftreten:
sudo chown -R $USER:$USER ~/.npm
npm cache clean --force
npm install
```

### 3. Development Server starten

```bash
npm run dev
```

**Die App läuft jetzt auf:** `http://localhost:9000`

**Browser öffnen:**
```bash
# Firefox
firefox http://localhost:9000

# Chrome/Chromium
google-chrome http://localhost:9000

# Standard-Browser
xdg-open http://localhost:9000
```

### 4. Production Build (Optional)

Für Produktiv-Einsatz oder bessere Performance:

```bash
npm run build
npm run preview
```

---

## ⚙️ GitHub Backup einrichten

### Schritt 1: GitHub Token erstellen

1. **GitHub öffnen:** [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. **"Generate new token"** → **"Classic"**
3. **Token-Name:** z.B. "Dokument Scanner Backup"
4. **Permissions auswählen:**
   - ✅ `repo` (Full control of private repositories)
5. **"Generate token"** klicken
6. **Token kopieren** (wird nur einmal angezeigt!)

```
Beispiel-Token: ghp_1234567890abcdefghijklmnopqrstuvwxyz
```

### Schritt 2: Repository erstellen

```bash
# Option 1: Via GitHub Web-Interface
# 1. Auf GitHub: "New Repository" klicken
# 2. Name: "dokument-scanner-backup" (oder beliebig)
# 3. Private Repository (empfohlen!)
# 4. Erstellen (OHNE README)

# Option 2: Via CLI (gh tool benötigt)
gh repo create dokument-scanner-backup --private
```

### Schritt 3: In App konfigurieren

1. **App öffnen:** `http://localhost:9000`
2. **Settings → GitHub Synchronisation**
3. **Eingeben:**
   - **Owner:** Dein GitHub Username (z.B. `MKI13`)
   - **Repository:** Repository-Name (z.B. `dokument-scanner-backup`)
   - **Token:** Das generierte Token (z.B. `ghp_...`)
4. **"Speichern"** klicken

### Schritt 4: Testen

1. **"Verbindung testen"** klicken
   - ✅ Sollte "Verbindung erfolgreich!" zeigen
2. **Dokument hochladen** (Test-Rechnung)
3. **"Zu GitHub hochladen"** klicken
   - ✅ Upload sollte erfolgreich sein
4. **Prüfen auf GitHub:**
   ```
   https://github.com/[DEIN-USERNAME]/[REPO-NAME]
   ```
   Sollte zeigen:
   ```
   backup.json
   images/
   └── 2026/
       └── 01/
           └── 2026_01_13_Hagebaumarkt_52,36EUR.jpg
   ```

### Schritt 5: Von GitHub laden (Wiederherstellung)

1. **"Von GitHub laden"** klicken
2. **Lädt alle Dokumente herunter:**
   - JSON-Datei mit Metadaten
   - Alle Bilder aus verschiedenen Pfaden
   - Importiert in lokale IndexedDB

---

## 📋 Verwendung

### Dokumente hochladen

1. **Klicke auf "Hochladen" Button**
2. **Wähle Dateien aus** oder ziehe sie per **Drag & Drop**
3. **Automatische Verarbeitung:**
   - ✅ OCR Texterkennung (Deutsch)
   - ✅ Datum-Extraktion (Format: DD.MM.YYYY)
   - ✅ Kunden-Erkennung (erster Name)
   - ✅ Betrag-Erkennung (BRUTTO bevorzugt!)
   - ✅ Dateiname: `YYYY_MM_DD_Kunde_Betrag.ext`

**Beispiel-Dateiname:**
```
2026_01_13_Hagebaumarkt_52,36EUR.jpg
```

**Alte Dateien (vor v1.7.0):**
```
2026_01_13_Hagebaumarkt_52,36€.jpg  (UTF-8 Probleme!)
```

### Ansichten wechseln

**Nach Monat**
- Dokumente gruppiert nach Monat
- Chronologisch sortiert (neueste zuerst)
- Monats-Statistik (Anzahl, Gesamtbetrag)

**Nach Kunde**
- Dokumente gruppiert nach Kundenname
- Alphabetisch sortiert
- Kunden-Statistik (Anzahl Rechnungen, Gesamtbetrag)

**Alle Dokumente**
- Vollständige Liste
- Suchfunktion (Volltextsuche)
- Sortierung: Datum, Name, Kunde, Betrag

### Dokument bearbeiten

1. **Klicke auf Dokument** (öffnet Detail-Ansicht)
2. **Klicke auf "Bearbeiten"**
3. **Passe Metadaten an:**
   - Datum (falls falsch erkannt)
   - Kunde (falls falsch oder fehlt)
   - Betrag (falls Netto statt Brutto erkannt)
   - Notizen hinzufügen

### Volltextsuche

Die Suche durchsucht automatisch:
- ✅ Dateiname
- ✅ Erkannter Text (vollständiger OCR-Text)
- ✅ Kundenname
- ✅ Notizen
- ✅ Betrag

**Beispiel-Suchen:**
```
Hagebaumarkt        → Findet alle Hagebaumarkt-Rechnungen
52,36               → Findet Rechnung mit diesem Betrag
Januar 2026         → Findet alle Dokumente aus Januar 2026
Rechnung            → Findet alle als "Rechnung" markierten Docs
```

---

## 🛠️ Technologie-Stack

- **Frontend:** React 18 + TypeScript
- **Bundler:** Vite 5
- **OCR:** Tesseract.js 5.1 (Deutsch-Training)
- **PDF:** PDF.js (Mozilla)
- **Datenbank:** Dexie.js (IndexedDB Wrapper)
- **Kompression:** browser-image-compression
- **PWA:** vite-plugin-pwa (Workbox)
- **Icons:** Lucide React
- **Datums-Formatierung:** Native JS (kein date-fns mehr)
- **Backup:** GitHub REST API v3

---

## 📁 Projektstruktur

```
dokument-scanner/
├── src/
│   ├── components/
│   │   ├── Header.tsx                    # Header mit Version
│   │   ├── Upload/
│   │   │   ├── FileUploader.tsx          # Drag & Drop Upload
│   │   │   └── DuplicateWarningModal.tsx # Duplikat-Check
│   │   ├── Views/
│   │   │   ├── MonthView.tsx             # Nach Monat gruppiert
│   │   │   ├── CustomerView.tsx          # Nach Kunde gruppiert
│   │   │   └── DocumentListView.tsx      # Alle Dokumente
│   │   └── Document/
│   │       ├── DocumentCard.tsx          # Thumbnail + Info
│   │       ├── DocumentDetail.tsx        # Vollansicht + OCR-Text
│   │       └── DocumentEdit.tsx          # Metadaten bearbeiten
│   ├── pages/
│   │   └── Settings.tsx                  # GitHub Konfiguration
│   ├── services/
│   │   ├── ocr.service.improved.ts       # Tesseract mit DE-Patterns
│   │   ├── pdf.service.ts                # PDF.js Integration
│   │   ├── database.service.ts           # Dexie DB (IndexedDB)
│   │   ├── document.service.ts           # Haupt-Business-Logik
│   │   ├── github.service.ts             # GitHub Backup/Sync
│   │   └── compression.service.ts        # Bild-Kompression
│   ├── types/
│   │   └── document.ts                   # TypeScript Interfaces
│   ├── App.tsx                           # Haupt-App-Komponente
│   ├── App.css                           # Global Styles
│   └── main.tsx                          # Entry Point
├── public/
│   └── manifest.json                     # PWA Manifest
├── package.json                          # Dependencies (v1.7.0)
├── tsconfig.json                         # TypeScript Config
├── vite.config.ts                        # Vite Build Config
└── README.md                             # Diese Datei

```

---

## 🔧 Troubleshooting

### 1. Bilder laden nicht von GitHub

**Problem:** "KEIN BILD GEFUNDEN" beim Download

**Ursache:** UTF-8 Encoding-Probleme mit € Symbol

**Lösung:**
- ✅ **Ab v1.7.0:** Verwendet `EUR` statt `€` in Dateinamen
- ✅ **Backward-Kompatibel:** Sucht nach 54 Varianten:
  - `52,36EUR.jpg` (neu)
  - `52,36€.jpg` (alt)
  - `52,36â¬.jpg` (korrupt)
  - `52,36â¬-.jpg` (doppelt korrupt)

**Manuell prüfen:**
```bash
# Im Browser: F12 → Console
# Logs zeigen welche Pfade probiert werden:
🔍 Probiere 54 Pfad-Varianten...
✅ GEFUNDEN: images/2026/01/filename.jpg
```

### 2. Version zeigt alte v1.5.9

**Problem:** App zeigt nicht v1.7.0 nach Update

**Lösung:**
```bash
# Hard Refresh im Browser
Strg + Shift + R  (Linux/Windows)
Cmd + Shift + R   (Mac)

# Oder Cache löschen:
# Browser → DevTools (F12) → Application → Clear Storage
```

### 3. OCR erkennt Netto statt Brutto

**Problem:** Betrag ist zu niedrig (13,03€ statt 15,51€)

**Ursache:** Alte OCR-Prioritäten

**Lösung:**
- ✅ **Ab v1.7.0:** BRUTTO hat Priorität 1, NETTO Priorität 8
- Falls falsch: Dokument bearbeiten und Betrag korrigieren

**Pattern-Prioritäten:**
```
1. BRUTTO, ENDBETRAG, RECHNUNGSBETRAG
2. SUMME, GESAMT, TOTAL (ohne NETTO)
3. ZU BEZAHLEN, ZU ZAHLEN
4. Betrag in €: ... Format
5. Generisches Betrag-Pattern
6. EUR/€ mit Zahl
7. Betrag: Zeile
8. NETTO (niedrigste Priorität!)
```

### 4. Datum wird falsch erkannt

**Problem:** 2025 statt 2026 im Dateinamen

**Ursache:** OCR erkennt falsches Datum oder 2-stelliges Jahr

**Lösung:**
- ✅ Prüfe Rechnung: Rechnungsdatum vs. Lieferdatum
- ✅ 2-stellige Jahre werden automatisch konvertiert:
  - `00-49` → `2000-2049`
  - `50-99` → `1950-1999`
- ✅ Dokument bearbeiten und Datum korrigieren

**Logs prüfen:**
```javascript
// Browser Console (F12):
📅 Datum gefunden: 13.01.2026 → 13.1.2026
📅 2-stelliges Jahr konvertiert: 26 → 2026
```

### 5. GitHub "403 Forbidden" Fehler

**Problem:** Upload/Download schlägt fehl

**Ursache:** Token-Berechtigungen fehlen

**Lösung:**
1. **Neues Token erstellen:** [GitHub Settings](https://github.com/settings/tokens)
2. **Permissions:** ✅ `repo` (Full control)
3. **Token in Settings eintragen**
4. **"Verbindung testen"** klicken

### 6. Node.js Fehler beim Start

**Problem:** `npm run dev` schlägt fehl

**Ursache:** Alte Node.js Version

**Lösung:**
```bash
# Node Version prüfen
node --version

# Mindestens v18 benötigt!
# Update via nvm:
nvm install 20
nvm use 20

# Oder via apt:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 7. IndexedDB Quota exceeded

**Problem:** "QuotaExceededError" beim Speichern

**Ursache:** Zu viele große Dateien

**Lösung:**
```bash
# Alte Dokumente löschen oder
# Browser Storage erhöhen:
# Chrome: chrome://settings/content/all
# Firefox: about:preferences#privacy
```

### 8. Service Worker Fehler

**Problem:** App lädt nicht oder zeigt alte Version

**Lösung:**
```bash
# DevTools (F12) → Application → Service Workers
# → "Unregister" klicken
# → Seite neu laden (Strg+Shift+R)
```

---

## 🔒 Datenschutz & Sicherheit

### 100% Lokal (Standard-Modus)

- ✅ **Keine Daten verlassen deinen Computer**
- ✅ **Kein externer Server**
- ✅ **Keine Cloud**
- ✅ **Kein Tracking**
- ✅ **Keine Analytics**
- ✅ Alle Daten in **IndexedDB** (Browser-Datenbank)

### GitHub Backup (Optional)

- ⚠️ **Daten werden zu GitHub hochgeladen**
- ✅ **Private Repository empfohlen!**
- ✅ **Token wird verschlüsselt in LocalStorage gespeichert**
- ✅ **GitHub-Zugriff nur mit deinem Token**
- ⚠️ **Sensible Dokumente:** Nutze Private Repo + 2FA!

**Sicherheits-Empfehlungen:**
```bash
# 1. Private Repository verwenden
gh repo create backup --private

# 2. Two-Factor Authentication (2FA) aktivieren
# GitHub → Settings → Security → 2FA

# 3. Token-Berechtigungen minimieren
# Nur "repo" Scope, nicht "admin"

# 4. Token regelmäßig rotieren
# Alle 90 Tage neues Token erstellen
```

---

## 📊 Performance & Limits

### OCR-Geschwindigkeit (Tesseract.js)

| Dateigröße | Verarbeitungszeit | Empfehlung |
|------------|-------------------|------------|
| < 1 MB     | 2-4 Sekunden      | Optimal    |
| 1-3 MB     | 5-8 Sekunden      | Gut        |
| 3-5 MB     | 10-15 Sekunden    | OK         |
| > 5 MB     | 20-30 Sekunden    | Komprimieren! |

**Performance-Tipps:**
```bash
# Bilder vor Upload komprimieren (Kubuntu):
sudo apt install imagemagick
mogrify -resize 2000x2000\> -quality 85 *.jpg

# Oder in App: Automatische Kompression auf 1920x1920px
```

### Speicher-Limits (IndexedDB)

| Browser        | Quota           | Empfehlung        |
|----------------|-----------------|-------------------|
| Chrome/Edge    | ~60% RAM        | Bis zu 10GB+      |
| Firefox        | ~50% Disk       | Bis zu 5GB+       |
| Safari         | 1GB (Desktop)   | Max. 500 Docs     |

**Speicher prüfen:**
```javascript
// Browser Console (F12):
navigator.storage.estimate().then(est => {
  console.log(`Verwendet: ${(est.usage/1024/1024).toFixed(2)} MB`);
  console.log(`Verfügbar: ${(est.quota/1024/1024).toFixed(2)} MB`);
});
```

### Offline-Fähigkeit

- ✅ **Alle Funktionen offline** (nach erstem Laden)
- ✅ **Tesseract-Modell** (~4MB) wird gecacht
- ✅ **PWA-Manifest** für Installation
- ⚠️ **GitHub-Sync** benötigt Internet

---

## 🧪 Entwicklung & Testing

### Lokale Entwicklung

```bash
# Development Server mit Hot-Reload
npm run dev

# TypeScript Type-Checking
npm run type-check

# Build für Production
npm run build

# Preview Production Build
npm run preview
```

### Debugging

```bash
# Browser DevTools öffnen
F12 oder Rechtsklick → "Untersuchen"

# IndexedDB prüfen
Application → Storage → IndexedDB → DocumentScanner → documents

# Console Logs aktivieren
# Alle Services loggen umfangreich:
# - OCR: Erkannte Patterns
# - GitHub: API Calls
# - Document Service: Dateiname-Generierung
```

### Neue Features entwickeln

1. **Service erstellen:** `src/services/mein-feature.service.ts`
2. **Komponente erstellen:** `src/components/MeinFeature.tsx`
3. **In App integrieren:** `src/App.tsx`
4. **TypeScript-Types:** `src/types/document.ts`

**Beispiel:**
```typescript
// src/services/export.service.ts
export class ExportService {
  async exportToPDF(documents: Document[]): Promise<Blob> {
    // Implementation
  }
}

// src/components/ExportButton.tsx
export function ExportButton() {
  const handleExport = async () => {
    const blob = await exportService.exportToPDF(docs);
    // ...
  };
  return <button onClick={handleExport}>Export</button>;
}
```

---

## 🔄 Versions-Historie

### v1.7.0 (2026-01-30) - UTF-8 Encoding Fix

**Kritische Fixes:**
- ✅ **EUR statt €** in Dateinamen (UTF-8 safe)
- ✅ **Trailing Dash** (`â¬-`) Korrektur
- ✅ **54 Dateinamen-Varianten** für Backward-Kompatibilität
- ✅ **BRUTTO-Priorität** (Netto nur Fallback)
- ✅ **Datums-Logging** verbessert

**Filename-Format:**
```
YYYY_MM_DD_Kunde_Betrag.ext

Beispiel: 2026_01_13_Hagebaumarkt_52,36EUR.jpg
```

### v1.6.0 - GitHub Backup Integration

- ✅ GitHub Upload/Download
- ✅ Jahr/Monat Ordnerstruktur
- ✅ JSON Metadaten-Export
- ✅ Multiple Pfad-Varianten beim Download

### v1.5.0 - OCR Verbesserungen

- ✅ Deutsche Pattern-Optimierung
- ✅ Duplikat-Erkennung via SHA-256
- ✅ Progressive OCR mit Feedback

---

## 📞 Support & Kontakt

### Bei Problemen

1. **Browser Console prüfen** (F12 → Console)
2. **IndexedDB Daten prüfen** (F12 → Application → Storage)
3. **GitHub Issue erstellen:** [https://github.com/MKI13/dokument-scanner/issues](https://github.com/MKI13/dokument-scanner/issues)

### Feature-Wünsche

Erstelle ein Issue auf GitHub mit:
- ✅ Detaillierte Beschreibung
- ✅ Use-Case Beispiel
- ✅ Mockup/Screenshot (wenn möglich)

---

## 📄 Lizenz

**MIT License** - Frei verwendbar für private und kommerzielle Projekte.

```
Copyright (c) 2026 ef-sinn.de

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[Full MIT License text...]
```

---

## 🏢 Über ef-sinn.de

**Entwickelt von und für [ef-sinn.de](https://ef-sinn.de)**

Professionelle Dokumentenverwaltung speziell für Handwerksbetriebe entwickelt - mit Fokus auf:
- ✅ **Datenschutz** (lokale Verarbeitung)
- ✅ **Offline-Fähigkeit** (keine Internet-Abhängigkeit)
- ✅ **Einfache Bedienung** (Drag & Drop)
- ✅ **Automatisierung** (intelligente Extraktion)

---

**Made with ❤️ in Kubuntu Linux by [ef-sinn.de](https://ef-sinn.de)**

Version: **1.7.0** | Letztes Update: **30. Januar 2026**
