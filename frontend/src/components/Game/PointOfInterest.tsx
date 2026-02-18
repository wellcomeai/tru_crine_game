import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import type { PointOfInterest as POIType } from '../../types';

interface PointOfInterestProps {
  poi: POIType;
  onClick: () => void;
}

export default function PointOfInterest({ poi, onClick }: PointOfInterestProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleTap = useCallback(() => {
    // On touch devices: first tap shows tooltip, second tap executes action
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch && !showTooltip && !poi.is_examined) {
      setShowTooltip(true);
      // Auto-hide after 3s
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    onClick();
  }, [showTooltip, poi.is_examined, onClick]);

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      onClick={handleTap}
      className={`absolute group ${
        poi.is_examined ? '' : 'poi-pulse'
      }`}
      style={{
        left: `${poi.x_percent}%`,
        top: `${poi.y_percent}%`,
        width: `${poi.width_percent}%`,
        height: `${poi.height_percent}%`,
        minWidth: '44px',
        minHeight: '44px',
      }}
    >
      <div
        className={`w-full h-full rounded-lg transition-all ${
          poi.is_examined
            ? 'border-2 lg:border-2 border-green-600/50 bg-green-900/20'
            : 'border-[3px] lg:border-2 border-gold/60 bg-gold/10 hover:bg-gold/20'
        }`}
      >
        {poi.is_examined && (
          <div className="absolute -top-1 -right-1">
            <CheckCircle size={14} className="text-green-500" />
          </div>
        )}
      </div>

      {/* Tooltip — visible on hover (desktop) or tap (mobile) */}
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                       transition-opacity pointer-events-none z-10
                       ${showTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="bg-noir-700 text-gray-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-noir-500">
          {poi.label}
          {poi.has_evidence && !poi.is_examined && (
            <span className="text-gold ml-1">✦</span>
          )}
          {showTooltip && !poi.is_examined && (
            <span className="text-gray-400 ml-2 text-[10px]">Нажмите ещё раз</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
