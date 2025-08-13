import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils';
import { ModalProps } from '../../types';

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  const sizes = {
    sm: 'modal-box w-11/12 max-w-md',
    md: 'modal-box w-11/12 max-w-lg',
    lg: 'modal-box w-11/12 max-w-2xl',
    xl: 'modal-box w-11/12 max-w-4xl',
  };

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    if (isOpen) {
      modal.showModal();
    } else {
      modal.close();
    }

    const handleClose = () => {
      onClose();
    };

    modal.addEventListener('close', handleClose);
    return () => modal.removeEventListener('close', handleClose);
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog 
      ref={modalRef} 
      className="modal"
      onClick={handleBackdropClick}
    >
      <div className={cn(sizes[size])}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default Modal;