#!/bin/bash

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/storage/emulated/0/dokument-scanner-compact-${TIMESTAMP}"

echo "📦 Erstelle kompaktes Backup (ohne node_modules)..."

mkdir -p "${BACKUP_DIR}"

cp -r src "${BACKUP_DIR}/"
cp -r public "${BACKUP_DIR}/"
cp package.json "${BACKUP_DIR}/"
cp package-lock.json "${BACKUP_DIR}/" 2>/dev/null
cp tsconfig.json "${BACKUP_DIR}/" 2>/dev/null
cp tsconfig.node.json "${BACKUP_DIR}/" 2>/dev/null
cp vite.config.ts "${BACKUP_DIR}/" 2>/dev/null
cp index.html "${BACKUP_DIR}/" 2>/dev/null

cat > "${BACKUP_DIR}/INSTALLATION.txt" << 'INST'
INSTALLATION ANLEITUNG
======================

1. Kopiere nach Termux:
   cp -r /storage/emulated/0/dokument-scanner-compact-* ~/dokument-scanner-neu

2. cd ~/dokument-scanner-neu

3. npm install

4. npm run dev

FERTIG!
INST

find . -type f -not -path "./node_modules/*" -not -path "./.git/*" > "${BACKUP_DIR}/DATEILISTE.txt"

echo ""
echo "✅ Backup erstellt: ${BACKUP_DIR}"
du -sh "${BACKUP_DIR}"
find "${BACKUP_DIR}" -type f | wc -l
echo "🎉 Fertig!"
