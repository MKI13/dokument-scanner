importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

let worker = null;

self.onmessage = async function(e) {
  const { type, imageData, jobId } = e.data;
  
  if (type === 'init') {
    try {
      worker = await Tesseract.createWorker('deu', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            self.postMessage({
              type: 'progress',
              jobId: jobId,
              progress: m.progress * 100
            });
          }
        }
      });
      
      self.postMessage({ type: 'ready', jobId: jobId });
    } catch (error) {
      self.postMessage({ 
        type: 'error', 
        jobId: jobId,
        error: error.message 
      });
    }
  }
  
  if (type === 'recognize') {
    try {
      if (!worker) {
        throw new Error('Worker not initialized');
      }
      
      const { data } = await worker.recognize(imageData);
      
      self.postMessage({
        type: 'result',
        jobId: jobId,
        text: data.text,
        confidence: Math.round(data.confidence)
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        jobId: jobId,
        error: error.message
      });
    }
  }
  
  if (type === 'terminate') {
    if (worker) {
      await worker.terminate();
      worker = null;
    }
    self.postMessage({ type: 'terminated', jobId: jobId });
  }
};
