/**
 * BRIDGE: Node.js ↔ Python OCR
 * Ruft python_ocr_ultra.py auf
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface PythonOCRResult {
  text: string;
  confidence: number;
  success: boolean;
  method?: string;
  error?: string;
}

class PythonOCRBridge {
  
  private pythonScript = path.join(process.cwd(), 'python_ocr_ultra.py');
  
  async recognize(imageFile: File): Promise<PythonOCRResult> {
    let tempPath: string | null = null;
    
    try {
      // Speichere Bild temporär
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      tempPath = `/tmp/ocr_${Date.now()}.jpg`;
      await writeFile(tempPath, buffer);
      
      console.log('🔧 Rufe Python OCR auf:', tempPath);
      
      // Rufe Python Script auf
      const { stdout, stderr } = await execAsync(
        `python3 "${this.pythonScript}" "${tempPath}"`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB Buffer
      );
      
      if (stderr) {
        console.log('Python stderr:', stderr);
      }
      
      // Parse JSON Result
      const result: PythonOCRResult = JSON.parse(stdout);
      
      console.log('✅ Python OCR Ergebnis:', {
        success: result.success,
        confidence: result.confidence,
        textLength: result.text?.length || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Python OCR Fehler:', error);
      
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
    } finally {
      // Aufräumen
      if (tempPath) {
        try {
          await unlink(tempPath);
        } catch {}
      }
    }
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('python3 --version');
      await execAsync('tesseract --version');
      return true;
    } catch {
      return false;
    }
  }
}

export const pythonOCRBridge = new PythonOCRBridge();
