// client/src/components/common/Modal.jsx

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    document.addEventListener('keydown', handleKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
        className={[
          'animate-fade-up w-full',
          'rounded-t-2xl border-t border-neutral-800 bg-neutral-900',
          'shadow-2xl shadow-black/60',
          'sm:rounded-xl sm:border',
          SIZES[size] ?? SIZES.md,
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          {title ? (
            <h2 id="modal-title" className="text-base font-bold text-neutral-100">
              {title}
            </h2>
          ) : (
            /* Drag handle for mobile sheet feel */
            <div className="mx-auto h-1 w-10 rounded-full bg-neutral-700 sm:hidden" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;