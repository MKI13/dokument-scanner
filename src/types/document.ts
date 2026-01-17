export interface Document {
  id?: number;
  filename: string;
  originalFilename: string;
  blob: Blob;
  uploadDate: Date;
  customer?: string;
  amount?: number;
  invoiceNumber?: string;
  date?: Date;
  ocrText?: string;
  tags?: string[];
}
