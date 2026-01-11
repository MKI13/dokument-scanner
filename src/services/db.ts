import Dexie, { Table } from 'dexie';
import { Document } from '../types';

export class DocumentDatabase extends Dexie {
  documents!: Table<Document, number>;

  constructor() {
    super('DocumentScannerDB');
    
    this.version(1).stores({
      documents: '++id, filename, uploadDate, documentDate, customer, amount, [year+month]'
    });
  }
}

export const db = new DocumentDatabase();
