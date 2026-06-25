// client/src/components/common/Modal.jsx

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const SIZE_STYLES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(event) => event.stopPropagation()}
        className={`w-full ${SIZE_STYLES[size]} rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl`}
      >
        {title && (
          <h2 id="modal-title" className="text-lg font-bold text-neutral-100">
            {title}
          </h2>
        )}
        <div className={title ? 'mt-4' : ''}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;