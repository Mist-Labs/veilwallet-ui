import { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showCancel?: boolean;
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmLoading?: boolean;
  variant?: 'default' | 'danger';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCancel = true,
  showConfirm = true,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmLoading = false,
  variant = 'default',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-4 pr-8">{title}</h2>

        {/* Content */}
        <div className="text-white/80 mb-6">{children}</div>

        {/* Actions */}
        <div className="flex space-x-3">
          {showCancel && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {cancelText}
            </Button>
          )}
          {showConfirm && (
            <Button
              onClick={onConfirm}
              isLoading={confirmLoading}
              className={`flex-1 ${
                variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
              }`}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

