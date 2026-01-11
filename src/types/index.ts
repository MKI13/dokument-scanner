export interface Document {
  id?: number;  // WICHTIG: number, nicht string!
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  blob: Blob;
  uploadDate: Date;
  documentDate: Date;
  customer: string | null;
  amount: number | null;
  extractedText: string;
  ocrConfidence: number;
  month: number;
  year: number;
}
