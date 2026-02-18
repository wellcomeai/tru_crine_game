import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BookOpen, Scale, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAboutClick?: () => void;
}

export default function MobileDrawer({ isOpen, onClose, onAboutClick }: MobileDrawerProps) {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { logout } = useAuthStore();

  const items = [
    {
      icon: FileText,
      label: 'О деле',
      onClick: () => {
        onClose();
        onAboutClick?.();
      },
    },
    {
      icon: BookOpen,
      label: 'Заметки',
      onClick: () => {
        onClose();
        navigate(`/game/${sessionId}/notebook`);
      },
    },
    {
      icon: Scale,
      label: 'Обвинить',
      onClick: () => {
        onClose();
        navigate(`/game/${sessionId}/accuse`);
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />

          {/* Drawer */}
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
                       border-t border-noir-600"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-noir-500" />
            </div>

            {/* Menu items */}
            <div className="px-4 pb-4 space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-3 w-full px-4 py-3.5
                               rounded-xl text-gray-300
                               active:bg-noir-700 transition-colors
                               min-h-[44px]"
                  >
                    <Icon size={20} className="text-gray-500" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}

              <div className="border-t border-noir-600 my-2" />

              <button
                onClick={() => {
                  onClose();
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5
                           rounded-xl text-red-400/70
                           active:bg-noir-700 transition-colors
                           min-h-[44px]"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Выйти</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
