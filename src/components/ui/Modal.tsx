import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            // اضافه شدن min-w و shrink-0 برای جلوگیری از فشرده شدن
            className="relative z-10 w-full min-w-[320px] sm:min-w-[450px] max-w-md shrink-0 rounded-2xl bg-surface-container p-6 shadow-xl border border-outline-variant/30"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline-sm text-xl font-bold text-on-surface flex items-center gap-2">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-full hover:bg-surface-variant/50 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>
            
            <div className="w-full">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}