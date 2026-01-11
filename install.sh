#!/bin/bash

echo "========================================="
echo "Dokument Scanner - Installation"
echo "========================================="
echo ""

# Prüfe ob node installiert ist
if ! command -v node &> /dev/null
then
    echo "❌ Node.js ist nicht installiert!"
    echo "Bitte installiere Node.js von: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js gefunden: $(node --version)"
echo "✅ npm gefunden: $(npm --version)"
echo ""

# Installiere Dependencies
echo "📦 Installiere Dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Installation erfolgreich!"
    echo "========================================="
    echo ""
    echo "Starten mit:"
    echo "  npm run dev"
    echo ""
    echo "Die App läuft dann auf:"
    echo "  http://localhost:9000"
    echo ""
else
    echo ""
    echo "❌ Installation fehlgeschlagen!"
    echo "Prüfe die Fehlermeldungen oben."
    exit 1
fi
