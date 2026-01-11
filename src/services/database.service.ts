import Dexie, { Table } from 'dexie';
import { Document } from '../types/document';

export class DocumentDatabase extends Dexie {
  documents!: Table<Document, number>;

  constructor() {
    super('DocumentScanner'); // ← BEHALTE ALTEN NAMEN!

    // Version 2 (bereits existiert)
    this.version(2).stores({
      documents: '++id, filename, year, month, [year+month], customer, uploadDate, documentDate, fileHash'
    });
  }
}

export const db = new DocumentDatabase();

// Debug Logging
console.log('💾 DATENBANK INITIALISIERT:', db.name);
console.log('📊 VERSION:', db.verno);
console.log('📁 TABLES:', db.tables.map(t => t.name));
