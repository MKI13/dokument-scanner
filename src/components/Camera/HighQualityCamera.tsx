import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Check, RotateCcw } from 'lucide-react';
import './HighQualityCamera.css';

interface HighQualityCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const HighQualityCamera: React.FC<HighQualityCameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);
  
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 4096, min: 1920 },
          height: { ideal: 2160, min: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 },
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
          
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          console.log('📸 Kamera:', settings.width, 'x', settings.height);
        };
      }
    } catch (error) {
      console.error('Kamera-Fehler:', error);
      alert('Kamera konnte nicht gestartet werden.');
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    console.log('📷 Capture:', canvas.width, 'x', canvas.height);
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    const imageUrl = canvas.toDataURL('image/jpeg', 1.0);
    setCapturedImage(imageUrl);
  };
  
  const handleConfirm = () => {
    if (!canvasRef.current) return;
    
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
          console.log('✅ Bild:', file.size, 'bytes');
          stopCamera();
          onCapture(file);
        }
      },
      'image/jpeg',
      1.0
    );
  };
  
  const handleRetake = () => {
    setCapturedImage(null);
  };
  
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };
  
  return (
    <div className="high-quality-camera">
      <div className="camera-header">
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
        <h2>Kamera (Max. Qualität)</h2>
        {!capturedImage && (
          <button className="toggle-camera-button" onClick={toggleCamera}>
            <RotateCcw size={20} />
          </button>
        )}
      </div>
      
      <div className="camera-container">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
            />
            <canvas 
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </>
        ) : (
          <img 
            src={capturedImage} 
            alt="Preview" 
            className="captured-preview"
          />
        )}
      </div>
      
      <div className="camera-controls">
        {!capturedImage ? (
          <button
            className="capture-button-large"
            onClick={handleCapture}
            disabled={!isReady}
          >
            <div className="capture-ring">
              <div className="capture-inner" />
            </div>
          </button>
        ) : (
          <div className="confirm-controls">
            <button className="retake-button" onClick={handleRetake}>
              <RotateCcw size={20} />
              Erneut
            </button>
            <button className="confirm-button" onClick={handleConfirm}>
              <Check size={20} />
              Verwenden
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
