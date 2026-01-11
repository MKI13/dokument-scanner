class ImageEnhancerService {
  
  // Verbessere Dokumenten-Bild: Kontrast, Helligkeit, Schärfe
  async enhanceDocument(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
    const ctx = canvas.getContext('2d')!;
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 1. Auto-Kontrast
    imageData = this.autoContrast(imageData);
    
    // 2. Helligkeit anpassen
    imageData = this.adjustBrightness(imageData, 1.1);
    
    // 3. Schärfen
    imageData = this.sharpen(imageData);
    
    // 4. Noise Reduction
    imageData = this.reduceNoise(imageData);
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  private autoContrast(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    // Finde min/max Werte
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (gray < min) min = gray;
      if (gray > max) max = gray;
    }
    
    // Normalisiere auf 0-255
    const scale = 255 / (max - min);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - min) * scale));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * scale));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * scale));
    }
    
    return imageData;
  }
  
  private adjustBrightness(imageData: ImageData, factor: number): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * factor);
      data[i + 1] = Math.min(255, data[i + 1] * factor);
      data[i + 2] = Math.min(255, data[i + 2] * factor);
    }
    
    return imageData;
  }
  
  private sharpen(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new ImageData(width, height);
    
    // Sharpen Kernel
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[ky + 1][kx + 1];
            
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }
        
        const idx = (y * width + x) * 4;
        output.data[idx] = Math.min(255, Math.max(0, r));
        output.data[idx + 1] = Math.min(255, Math.max(0, g));
        output.data[idx + 2] = Math.min(255, Math.max(0, b));
        output.data[idx + 3] = 255;
      }
    }
    
    return output;
  }
  
  private reduceNoise(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new ImageData(width, height);
    
    // Median Filter 3x3
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            rValues.push(data[idx]);
            gValues.push(data[idx + 1]);
            bValues.push(data[idx + 2]);
          }
        }
        
        rValues.sort((a, b) => a - b);
        gValues.sort((a, b) => a - b);
        bValues.sort((a, b) => a - b);
        
        const idx = (y * width + x) * 4;
        output.data[idx] = rValues[4];
        output.data[idx + 1] = gValues[4];
        output.data[idx + 2] = bValues[4];
        output.data[idx + 3] = 255;
      }
    }
    
    return output;
  }
  
  // Konvertiere zu Schwarz-Weiß Dokument (adaptive Threshold)
  toBlackAndWhite(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const output = new ImageData(width, height);
    
    // Berechne lokale Thresholds
    const blockSize = 15;
    const C = 10;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Berechne lokalen Durchschnitt
        let sum = 0;
        let count = 0;
        
        for (let by = Math.max(0, y - blockSize); by < Math.min(height, y + blockSize); by++) {
          for (let bx = Math.max(0, x - blockSize); bx < Math.min(width, x + blockSize); bx++) {
            const bidx = (by * width + bx) * 4;
            sum += (data[bidx] + data[bidx + 1] + data[bidx + 2]) / 3;
            count++;
          }
        }
        
        const localMean = sum / count;
        const threshold = localMean - C;
        const value = gray > threshold ? 255 : 0;
        
        output.data[idx] = output.data[idx + 1] = output.data[idx + 2] = value;
        output.data[idx + 3] = 255;
      }
    }
    
    return output;
  }
}

export const imageEnhancerService = new ImageEnhancerService();
