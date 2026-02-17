import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  closable?: boolean;
}

export function Modal({ open, onClose, title, children, className, closable = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    onClose?.();
    // Reset after a tick so back-to-back close attempts are idempotent
    requestAnimationFrame(() => { closingRef.current = false; });
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open || !closable) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closable, handleClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (closable && e.target === overlayRef.current) handleClose();
      }}
    >
      <div
        className={cn(
          'bg-surface-1 border border-border-default rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200',
          className,
        )}
      >
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted">
            {title && <h2 className="text-lg font-semibold text-gray-100">{title}</h2>}
            {closable && onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-surface-3"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
