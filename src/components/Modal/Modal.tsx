import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { modalService } from '../../services/modal.service';
import './Modal.css';

export const Modal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'confirm' | 'info'>('success');

  useEffect(() => {
    modalService.setMessageHandler((msg, ttl, tp) => {
      setMessage(msg);
      setTitle(ttl);
      setType(tp);
      setIsOpen(true);
    });
  }, []);

  const handleClose = (confirmed: boolean = false) => {
    setIsOpen(false);
    setTimeout(() => {
      modalService.resolve(confirmed);
    }, 200);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} className="modal-icon success" />;
      case 'error':
        return <XCircle size={48} className="modal-icon error" />;
      case 'confirm':
        return <AlertCircle size={48} className="modal-icon warning" />;
      case 'info':
        return <Info size={48} className="modal-icon info" />;
    }
  };

  // Formatiere Message mit Zeilenumbrüchen
  const formatMessage = (msg: string) => {
    return msg.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < msg.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => type !== 'confirm' && handleClose(false)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {getIcon()}
        <h2 className="modal-title">{title}</h2>
        <div className="modal-message">
          {formatMessage(message)}
        </div>

        <div className="modal-buttons">
          {type === 'confirm' ? (
            <>
              <button onClick={() => handleClose(false)} className="modal-btn secondary">
                Abbrechen
              </button>
              <button onClick={() => handleClose(true)} className="modal-btn primary">
                Bestätigen
              </button>
            </>
          ) : (
            <button onClick={() => handleClose(false)} className="modal-btn primary">
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
