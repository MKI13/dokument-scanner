import Dexie, { Table } from 'dexie';
import { Document } from '../types/document';

export class DocumentDatabase extends Dexie {
  documents!: Table<Document, number>;

  constructor() {
    super('DocumentScanner');
    
    this.version(3).stores({
      documents: '++id, filename, customer, amount, uploadDate, fileHash'
    });

    this.on('ready', () => {
      console.log('💾 DATENBANK BEREIT: DocumentScanner v3');
    });

    this.on('populate', () => {
      console.log('📊 Initialisiere neue Datenbank...');
    });
  }
}

export const db = new DocumentDatabase();
