import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import './FileUpload.css';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
      event.target.value = ''; // Reset input
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="file-input"
        disabled={disabled}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="file-input"
        disabled={disabled}
      />

      <button
        onClick={handleCameraClick}
        disabled={disabled}
        className="upload-button camera"
      >
        <Camera size={32} />
        <span>Kamera</span>
      </button>

      <button
        onClick={handleGalleryClick}
        disabled={disabled}
        className="upload-button gallery"
      >
        <Upload size={32} />
        <span>Galerie</span>
      </button>
    </div>
  );
};
