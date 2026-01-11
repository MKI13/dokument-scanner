import { documentService } from './document.service';

interface BatchJob {
  files: File[];
  onProgress?: (current: number, total: number, filename: string) => void;
  onComplete?: () => void;
  onError?: (filename: string, error: Error) => void;
}

class BatchProcessorService {
  private isProcessing = false;
  private queue: BatchJob[] = [];
  
  async processBatch(job: BatchJob): Promise<void> {
    this.queue.push(job);
    
    if (!this.isProcessing) {
      this.processNextBatch();
    }
  }
  
  private async processNextBatch(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const job = this.queue.shift()!;
    
    const { files, onProgress, onComplete, onError } = job;
    
    // PARALLEL PROCESSING (3 gleichzeitig)
    const PARALLEL_COUNT = 3;
    const results: Promise<void>[] = [];
    
    for (let i = 0; i < files.length; i += PARALLEL_COUNT) {
      const batch = files.slice(i, i + PARALLEL_COUNT);
      
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex;
        
        try {
          onProgress?.(fileIndex + 1, files.length, file.name);
          
          await documentService.processAndSaveDocument(file);
          
        } catch (error) {
          console.error('Batch error:', file.name, error);
          onError?.(file.name, error as Error);
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    onComplete?.();
    
    // Nächsten Job verarbeiten
    this.processNextBatch();
  }
  
  isQueueEmpty(): boolean {
    return this.queue.length === 0 && !this.isProcessing;
  }
  
  getQueueLength(): number {
    return this.queue.length;
  }
}

export const batchProcessorService = new BatchProcessorService();
