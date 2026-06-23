import React, { useState, useEffect } from 'react';

export default function CustomDialog({ isOpen, type, title, message, onConfirm, onCancel, inputPlaceholder }) {
  const [inputValue, setInputValue] = useState('');

  // Reset input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      if (onCancel) onCancel();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '400px', width: '90%', padding: '30px', textAlign: 'center', background: '#111', border: '1px solid #333', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '15px', color: '#fff' }}>{title || 'تنبيه'}</h2>
        <p style={{ marginBottom: '25px', color: '#ccc', lineHeight: '1.6' }}>{message}</p>
        
        {type === 'prompt' && (
          <input 
            type="text" 
            autoFocus
            className="custom-select" 
            style={{ width: '100%', marginBottom: '25px', textAlign: 'center' }} 
            placeholder={inputPlaceholder || "أدخل القيمة هنا..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            onClick={handleConfirm}
            style={{ 
              background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '8px', 
              fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 
            }}
          >
            موافق
          </button>
          
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              onClick={onCancel}
              style={{ 
                background: '#444', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '8px', 
                fontSize: '1rem', cursor: 'pointer', flex: 1 
              }}
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
