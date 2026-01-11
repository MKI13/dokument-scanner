class ImageOptimizerService {
  
  async optimizeForOCR(file: File): Promise<File> {
    try {
      console.log('🔧 Optimiere Bild für OCR...');
      
      // 1. Bild laden
      const bitmap = await createImageBitmap(file);
      
      // 2. Canvas mit HOHER Auflösung erstellen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Mindestens 2000px Breite für gute OCR
      const targetWidth = Math.max(bitmap.width, 2000);
      const scale = targetWidth / bitmap.width;
      
      canvas.width = targetWidth;
      canvas.height = bitmap.height * scale;
      
      // 3. Bild mit hoher Qualität zeichnen
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      
      // 4. Kontrast erhöhen für bessere OCR
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.enhanceContrast(imageData);
      ctx.putImageData(imageData, 0, 0);
      
      // 5. Als hochqualitatives JPEG speichern
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b!),
          'image/jpeg',
          0.95 // 95% Qualität
        );
      });
      
      const optimizedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, '_optimized.jpg'),
        { type: 'image/jpeg' }
      );
      
      console.log('✅ Optimiert:', file.size, '→', optimizedFile.size, 'bytes');
      console.log('📐 Auflösung:', canvas.width, 'x', canvas.height);
      
      return optimizedFile;
      
    } catch (error) {
      console.error('❌ Optimierung fehlgeschlagen:', error);
      return file; // Fallback: Original-Datei
    }
  }
  
  private enhanceContrast(imageData: ImageData): void {
    const data = imageData.data;
    const factor = 1.3; // 30% mehr Kontrast
    
    for (let i = 0; i < data.length; i += 4) {
      // Graustufen für bessere Lesbarkeit
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Kontrast erhöhen
      let enhanced = ((gray - 128) * factor) + 128;
      enhanced = Math.max(0, Math.min(255, enhanced));
      
      data[i] = enhanced;     // R
      data[i + 1] = enhanced; // G
      data[i + 2] = enhanced; // B
      // data[i + 3] bleibt Alpha
    }
  }
}

export const imageOptimizerService = new ImageOptimizerService();
