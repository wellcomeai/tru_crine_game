import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { isMobile } = useMobile();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {isMobile ? (
            /* ─── Mobile: Bottom Sheet ─── */
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  onClose();
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-50
                         bg-noir-800 rounded-t-2xl
                         border-t border-noir-600
                         max-h-[85vh] flex flex-col"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-noir-500" />
              </div>

              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0 border-b border-noir-600/30">
                  <h3 className="font-serif text-base text-gold font-bold">{title}</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-500 active:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Content — scrollable */}
              <div className="overflow-y-auto flex-1 px-4 py-4">
                {children}
              </div>
            </motion.div>
          ) : (
            /* ─── Desktop: Centered Modal ─── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-noir-800 rounded-xl border border-noir-600
                           max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {title && (
                  <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h3 className="font-serif text-lg text-gold font-bold">{title}</h3>
                    <button
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                <div className="px-6 pb-6">
                  {children}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
