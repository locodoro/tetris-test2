import React from 'react';
import { Button } from '@/components/ui/button';

interface GameOverModalProps {
  score: number;
  level: number;
  lines: number;
  onRestart: () => void;
}

export function GameOverModal({ score, level, lines, onRestart }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-red-400 text-center mb-4">
          게임 오버!
        </h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-300">최종 점수:</span>
            <span className="text-yellow-400 font-bold">{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">달성 레벨:</span>
            <span className="text-blue-400 font-bold">{level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">제거한 라인:</span>
            <span className="text-green-400 font-bold">{lines}</span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={onRestart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            다시 시작
          </Button>
        </div>
      </div>
    </div>
  );
}
