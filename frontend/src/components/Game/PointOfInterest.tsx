import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import type { PointOfInterest as POIType } from '../../types';

interface PointOfInterestProps {
  poi: POIType;
  onClick: () => void;
}

export default function PointOfInterest({ poi, onClick }: PointOfInterestProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className={`absolute group ${
        poi.is_examined ? '' : 'poi-pulse'
      }`}
      style={{
        left: `${poi.x_percent}%`,
        top: `${poi.y_percent}%`,
        width: `${poi.width_percent}%`,
        height: `${poi.height_percent}%`,
      }}
    >
      <div
        className={`w-full h-full rounded-lg border-2 transition-all ${
          poi.is_examined
            ? 'border-green-600/50 bg-green-900/20'
            : 'border-gold/60 bg-gold/10 hover:bg-gold/20'
        }`}
      >
        {poi.is_examined && (
          <div className="absolute -top-1 -right-1">
            <CheckCircle size={14} className="text-green-500" />
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-noir-700 text-gray-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-noir-500">
          {poi.label}
          {poi.has_evidence && !poi.is_examined && (
            <span className="text-gold ml-1">✦</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
