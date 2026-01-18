export interface Document {
  id?: number;
  filename: string;
  originalFilename?: string;
  blob: Blob;
  uploadDate: Date;
  documentDate?: Date;
  customer?: string | null;
  amount?: number | null;
  extractedText?: string | null;
  ocrConfidence?: number | null;
  fileHash?: string;
  invoiceNumber?: string;
  ocrText?: string;
  tags?: string[];
}
