import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import './Modal.css';

type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface ModalProps {
  type?: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  type = 'info',
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Abbrechen'
}) => {
  const icons = {
    info: <Info size={48} />,
    success: <CheckCircle size={48} />,
    warning: <AlertTriangle size={48} />,
    error: <AlertCircle size={48} />,
    confirm: <AlertCircle size={48} />
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className={`modal-container modal-${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleCancel}>
          <X size={20} />
        </button>

        <div className="modal-icon">{icons[type]}</div>

        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>

        <div className="modal-actions">
          {onCancel && (
            <button className="modal-btn modal-btn-secondary" onClick={handleCancel}>
              {cancelText}
            </button>
          )}
          <button className="modal-btn modal-btn-primary" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
