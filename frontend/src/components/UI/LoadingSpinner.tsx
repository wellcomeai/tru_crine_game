import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: size, height: size }}
        className="border-2 border-noir-500 border-t-gold rounded-full"
      />
    </div>
  );
}
