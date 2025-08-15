import React from 'react';

interface GameInfoProps {
  score: number;
  level: number;
  lines: number;
  comboCount: number;
}

export function GameInfo({ score, level, lines, comboCount }: GameInfoProps) {
  return (
    <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 space-y-4">
      <div className="text-center">
        <h3 className="text-white text-sm font-semibold mb-2">점수</h3>
        <p className="text-2xl font-bold text-yellow-400">{score.toLocaleString()}</p>
      </div>
      
      <div className="text-center">
        <h3 className="text-white text-sm font-semibold mb-2">레벨</h3>
        <p className="text-xl font-bold text-blue-400">{level}</p>
      </div>
      
      <div className="text-center">
        <h3 className="text-white text-sm font-semibold mb-2">라인</h3>
        <p className="text-xl font-bold text-green-400">{lines}</p>
      </div>
      
      <div className="text-center">
        <h3 className="text-white text-sm font-semibold mb-2">콤보</h3>
        <p className="text-xl font-bold text-purple-400">
          {comboCount > 0 ? `${comboCount}x` : '0'}
        </p>
      </div>
    </div>
  );
}
