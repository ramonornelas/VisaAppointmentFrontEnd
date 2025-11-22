import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle modal-icon-success"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle modal-icon-warning"></i>;
      case 'error':
        return <i className="fas fa-times-circle modal-icon-error"></i>;
      case 'confirm':
        return <i className="fas fa-question-circle modal-icon-confirm"></i>;
      default:
        return <i className="fas fa-info-circle modal-icon-info"></i>;
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          {getIcon()}
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          {showCancel && (
            <button 
              className="modal-btn modal-btn-cancel" 
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button 
            className="modal-btn modal-btn-confirm" 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
