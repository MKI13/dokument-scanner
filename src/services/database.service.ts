import Dexie, { Table } from 'dexie';
import { Document } from '../types/document';

class DocumentDatabase extends Dexie {
  documents!: Table<Document, number>;

  constructor() {
    super('DocumentScanner');
    
    this.version(2).stores({
      documents: '++id, filename, customer, amount, date, uploadDate, fileHash'
    });

    console.log('💾 DATENBANK INITIALISIERT: DocumentScanner');
    console.log('📊 VERSION: 2');
    console.log('📁 TABLES:', this.tables.map(t => t.name));
  }

  async addDocument(doc: Omit<Document, 'id'>): Promise<number> {
    return await this.documents.add(doc as Document);
  }

  async getAllDocuments(): Promise<Document[]> {
    return await this.documents.toArray();
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    return await this.documents.get(id);
  }

  async updateDocument(id: number, changes: Partial<Document>): Promise<number> {
    return await this.documents.update(id, changes);
  }

  async deleteDocument(id: number): Promise<void> {
    await this.documents.delete(id);
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const lowerQuery = query.toLowerCase();
    return await this.documents
      .filter(doc => 
        doc.filename.toLowerCase().includes(lowerQuery) ||
        doc.customer?.toLowerCase().includes(lowerQuery) ||
        doc.ocrText?.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  async getDocumentsByHash(hash: string): Promise<Document[]> {
    return await this.documents
      .where('fileHash')
      .equals(hash)
      .toArray();
  }
}

export const db = new DocumentDatabase();
