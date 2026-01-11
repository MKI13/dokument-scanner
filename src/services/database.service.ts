import Dexie, { Table } from 'dexie';
import { Document } from '../types/document';

class DocumentDatabase extends Dexie {
  documents!: Table<Document, number>;

  constructor() {
    super('DocumentScanner');
    
    // WICHTIG: Keine Compound-Indizes für Blob-Felder
    this.version(2).stores({
      documents: '++id, filename, customer, amount, uploadDate, fileHash'
    });

    console.log('💾 DATENBANK INITIALISIERT: DocumentScanner');
    console.log('📊 VERSION: 2');
    console.log('📁 TABLES:', this.tables.map(t => t.name));
  }
}

export const db = new DocumentDatabase();
