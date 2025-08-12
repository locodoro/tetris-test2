import React, { useState, useEffect } from 'react';
import { TETROMINOES, COLORS, TetrominoType } from '@/lib/tetris';

interface NextPieceProps {
  nextPiece: TetrominoType;
}

export function NextPiece({ nextPiece }: NextPieceProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4">
        <h3 className="text-white text-sm font-semibold mb-3 text-center">다음 블록</h3>
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  const tetromino = TETROMINOES[nextPiece];

  return (
    <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4">
      <h3 className="text-white text-sm font-semibold mb-3 text-center">다음 블록</h3>
      <div className="flex justify-center">
        <div className="w-20 h-20 grid grid-cols-4 grid-rows-4 gap-0 relative">
          {/* 4x4 그리드의 모든 셀을 먼저 렌더링 */}
          {Array.from({ length: 16 }, (_, index) => (
            <div
              key={`grid-${index}`}
              className="w-5 h-5 border border-gray-600 bg-transparent"
            />
          ))}
          
          {/* 테트로미노 블록을 중앙에 오버레이 */}
          {tetromino.map((row, y) =>
            row.map((cell, x) => {
              if (!cell) return null;
              
              // 4x4 그리드에서 중앙 정렬을 위한 위치 계산
              // 테트로미노 크기에 따라 중앙 정렬
              const tetrominoWidth = tetromino[0].length;
              const tetrominoHeight = tetromino.length;
              
              // 4x4 그리드에서 중앙 위치 계산
              const startX = Math.floor((4 - tetrominoWidth) / 2);
              const startY = Math.floor((4 - tetrominoHeight) / 2);
              
              const gridX = startX + x;
              const gridY = startY + y;
              
              return (
                <div
                  key={`piece-${x}-${y}`}
                  className={`
                    absolute w-5 h-5 border border-gray-600 ${COLORS[nextPiece]} shadow-inner
                  `}
                  style={{
                    left: `${gridX * 20}px`,
                    top: `${gridY * 20}px`,
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
