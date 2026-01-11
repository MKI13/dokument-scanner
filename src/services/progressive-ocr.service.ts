import { ocrService } from './ocr.service';

interface ProgressiveResult {
  quickText: string;
  quickConfidence: number;
  fullText?: string;
  fullConfidence?: number;
  isComplete: boolean;
}

class ProgressiveOCRService {
  
  async recognizeProgressive(
    file: File,
    onQuickResult?: (result: ProgressiveResult) => void,
    onFullResult?: (result: ProgressiveResult) => void,
    onProgress?: (stage: 'quick' | 'full', progress: number) => void
  ): Promise<ProgressiveResult> {
    
    // PHASE 1: Quick Scan (niedrige Auflösung, schnell)
    const quickFile = await this.createLowResVersion(file);
    
    const quickResult = await ocrService.recognize(quickFile, (progress) => {
      onProgress?.('quick', progress);
    });
    
    const progressive: ProgressiveResult = {
      quickText: quickResult.text,
      quickConfidence: quickResult.confidence,
      isComplete: false
    };
    
    onQuickResult?.(progressive);
    
    // PHASE 2: Full Scan (volle Auflösung, im Hintergrund)
    const fullResult = await ocrService.recognize(file, (progress) => {
      onProgress?.('full', progress);
    });
    
    progressive.fullText = fullResult.text;
    progressive.fullConfidence = fullResult.confidence;
    progressive.isComplete = true;
    
    onFullResult?.(progressive);
    
    return progressive;
  }
  
  private async createLowResVersion(file: File): Promise<File> {
    try {
      const bitmap = await createImageBitmap(file);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Reduzierte Auflösung für Quick-Scan (800px)
      const targetWidth = 800;
      const scale = targetWidth / bitmap.width;
      
      canvas.width = targetWidth;
      canvas.height = bitmap.height * scale;
      
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b!),
          'image/jpeg',
          0.7 // Niedrigere Qualität für Geschwindigkeit
        );
      });
      
      return new File([blob], `quick_${file.name}`, { type: 'image/jpeg' });
      
    } catch (error) {
      console.error('Low-res creation failed:', error);
      return file;
    }
  }
}

export const progressiveOCRService = new ProgressiveOCRService();
