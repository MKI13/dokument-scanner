# 🚀 SCHNELLSTART - Dokument Scanner App

## ⚡ Installation & Start (3 Schritte)

### 1️⃣ Terminal öffnen
Navigiere zum Projekt-Ordner:
```bash
cd dokument-scanner
```

### 2️⃣ Dependencies installieren
```bash
npm install
```

### 3️⃣ App starten
```bash
npm run dev
```

**✅ Fertig! Die App läuft auf: http://localhost:9000**

---

## 📱 Was die App kann

### ✨ Hauptfeatures
- ✅ **Lokale OCR** - Keine Cloud, kein API Key
- ✅ **Deutsche Texterkennung** - Optimiert für deutsche Dokumente
- ✅ **PDF & Bilder** - Alle Formate werden unterstützt
- ✅ **Intelligente Sortierung** - Nach Datum, Monat, Kunde
- ✅ **Automatische Erkennung** - Datum, Kunde, Dokumenttyp
- ✅ **Komplett Offline** - Funktioniert ohne Internet

### 📊 Ansichten
1. **Nach Monat** - Dokumente nach Monat gruppiert
2. **Nach Kunde** - Nach erkanntem Kunden sortiert
3. **Alle Dokumente** - Mit Suchfunktion und Filter

---

## 🎯 Erste Schritte

### Dokument hochladen
1. Klicke auf **"Hochladen"** Button (oben rechts)
2. Wähle PDF oder Bild aus
3. Die App erkennt automatisch:
   - 📅 Datum
   - 👤 Kunde/Rechnungssteller
   - 📄 Dokumenttyp (Rechnung/Lieferschein/Angebot)
   - 🏷️ Tags

### Dokument anzeigen
- Klicke auf eine Dokumentkarte
- Siehst **Vorschau** und **erkannten Text**
- Kannst **herunterladen** oder **bearbeiten**

### Dokument bearbeiten
- Klicke auf **"Bearbeiten"** Icon
- Passe Metadaten an:
  - Datum
  - Kunde
  - Typ
  - Tags
  - Notizen

### Suchen
- Nutze die Suchleiste in "Alle Dokumente"
- Durchsucht: Dateiname, Text, Kunde, Notizen, Tags

---

## 🔧 Technische Details

### Port
- **Development**: Port 9000
- **Production Build**: Port 9000

### Ordnerstruktur
```
dokument-scanner/
├── src/
│   ├── components/       # React Komponenten
│   ├── services/         # Business Logic
│   ├── types/           # TypeScript Definitionen
│   ├── App.tsx          # Haupt-App
│   └── main.tsx         # Entry Point
├── public/              # Statische Dateien
├── package.json         # Dependencies
└── vite.config.ts       # Vite Konfiguration
```

### Verwendete Technologien
- **React 18** + TypeScript
- **Tesseract.js** (OCR Engine)
- **PDF.js** (PDF Verarbeitung)
- **Dexie.js** (IndexedDB)
- **Vite** (Build Tool)

---

## 🎨 Anpassungen

### Port ändern
In `vite.config.ts`:
```typescript
server: {
  port: 9000  // Ändere hier die Port-Nummer
}
```

### OCR Sprache ändern
In `src/services/ocr.service.ts`:
```typescript
await createWorker('deu', ...)  // 'deu' = Deutsch, 'eng' = English
```

---

## 🐛 Troubleshooting

### Problem: "npm install" funktioniert nicht
**Lösung**: Prüfe Node.js Version
```bash
node --version  # Sollte >= 16.0.0 sein
npm --version   # Sollte >= 8.0.0 sein
```

### Problem: OCR ist sehr langsam
**Lösungen**:
- Komprimiere Bilder vor Upload (< 2MB)
- Nutze PDFs mit eingebettetem Text
- Erste Nutzung lädt Sprachmodell (dauert länger)

### Problem: Datum wird nicht erkannt
**Lösungen**:
- Prüfe Format: DD.MM.YYYY oder DD.MM.YY
- Bearbeite Dokument manuell nachträglich

### Problem: Port 9000 ist belegt
**Lösung**: Ändere Port in `vite.config.ts` (siehe oben)

---

## 💾 Daten-Speicherung

### Wo werden Daten gespeichert?
- **Browser IndexedDB** (lokal auf deinem Computer)
- **Datenbank Name**: "DocumentScanner"
- **Keine Cloud** - Alles bleibt lokal!

### Daten löschen
Browser DevTools öffnen:
1. Rechtsklick -> Untersuchen
2. Application Tab
3. IndexedDB -> DocumentScanner
4. Rechtsklick -> Delete Database

---

## 📝 Nützliche Kommandos

```bash
# Development starten
npm run dev

# Production Build
npm run build

# Build testen
npm run preview

# Dependencies aktualisieren
npm update

# Projekt aufräumen
rm -rf node_modules
npm install
```

---

## 🔐 Datenschutz

**100% Privat & Sicher**
- ✅ Alle Daten bleiben auf deinem Computer
- ✅ Keine Server-Verbindung
- ✅ Keine Cloud-Services
- ✅ Kein Tracking
- ✅ Open Source

---

## 🆘 Support

**Bei Problemen:**
1. Browser Console prüfen (F12)
2. README.md lesen
3. IndexedDB Daten prüfen

---

## ⚙️ Production Deployment

### Build erstellen
```bash
npm run build
```

Ergebnis im `dist/` Ordner kann auf jedem Webserver deployed werden.

### Als Desktop App (optional)
Die App kann mit Electron als Desktop-App verpackt werden.

---

**Viel Erfolg mit deiner Dokument Scanner App! 🎉**

Made with ❤️ for ef-sin Schreinerei
