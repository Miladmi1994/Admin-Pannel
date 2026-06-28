import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="absolute top-0 right-0 h-full w-full sm:w-[450px] bg-surface-container border-l border-outline-variant/30 shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/30 bg-surface-container-high/50">
              <h2 className="font-headline-sm text-xl font-bold text-on-surface flex items-center gap-2">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

