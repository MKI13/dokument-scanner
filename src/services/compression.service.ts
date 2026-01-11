import imageCompression from 'browser-image-compression';

class CompressionService {
  
  // INTELLIGENTE Kompression für OCR
  async prepareForOCR(file: File): Promise<Blob> {
    const fileSizeMB = file.size / 1024 / 1024;
    
    console.log(`📷 Original: ${fileSizeMB.toFixed(2)} MB`);
    
    // KLEINE Dateien (< 1.5 MB) → NICHT komprimieren!
    if (fileSizeMB < 1.5) {
      console.log('✅ Klein genug (< 1.5 MB), keine Kompression nötig');
      return file;
    }
    
    // GROSSE Dateien (>= 1.5 MB) → Komprimiere auf max 1.5 MB
    console.log('🔄 Komprimiere auf 1.5 MB...');
    const options = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2400,
      useWebWorker: false,
      quality: 0.85,
      initialQuality: 0.85
    };
    
    const compressed = await imageCompression(file, options);
    console.log(`✅ Komprimiert: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
    return compressed;
  }
  
  // Thumbnail - klein und schnell
  async createThumbnail(file: File): Promise<Blob> {
    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 300,
      useWebWorker: false,
      quality: 0.7
    };
    
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Thumbnail Fehler:', error);
      return file;
    }
  }
  
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const compressionService = new CompressionService();
