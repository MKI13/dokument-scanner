import Dexie, { Table } from 'dexie';

export interface Document {
  id?: number;
  filename: string;
  customer: string;
  date: string;
  amount: string;
  imageData: string;
  ocrText: string;
  createdAt: Date;
}

export class DocumentDatabase extends Dexie {
  documents!: Table<Document>;

  constructor() {
    super('DocumentScanner');
    this.version(1).stores({
      documents: '++id, filename, customer, date, amount, createdAt'
    });
  }
}

export const db = new DocumentDatabase();
