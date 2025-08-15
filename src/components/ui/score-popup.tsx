"use client";
import React from 'react';

export interface ScorePopup {
  id: string;
  value: number;
  x: number;
  y: number;
  t: number;
  type?: 'line-clear' | 'hard-drop' | 'combo' | 'special' | 'soft-drop';
  label?: string;
}

interface ScorePopupProps {
  popup: ScorePopup;
}

export function ScorePopupComponent({ popup }: ScorePopupProps) {
  const getPopupStyle = (type?: string) => {
    const baseStyle = "absolute font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]";
    
    switch (type) {
      case 'hard-drop':
        return `${baseStyle} text-blue-300 text-sm`;
      case 'combo':
        return `${baseStyle} text-purple-300 text-lg`;
      case 'special':
        return `${baseStyle} text-orange-300 text-lg`;
      case 'soft-drop':
        return `${baseStyle} text-green-300 text-sm`;
      case 'line-clear':
      default:
        return `${baseStyle} text-yellow-300 text-base`;
    }
  };

  const getLabel = (type?: string) => {
    switch (type) {
      case 'hard-drop':
        return 'HARD DROP';
      case 'combo':
        return 'COMBO!';
      case 'special':
        return 'SPECIAL!';
      case 'soft-drop':
        return 'SOFT DROP';
      default:
        return '';
    }
  };

  return (
    <div
      className={`${getPopupStyle(popup.type)} ux-score-pop`}
      style={{ 
        left: popup.x * 25, 
        top: popup.y * 25,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {popup.label && (
        <div className="text-center mb-1 text-xs opacity-80">
          {popup.label}
        </div>
      )}
      <div className="text-center">
        +{popup.value}
      </div>
    </div>
  );
}
