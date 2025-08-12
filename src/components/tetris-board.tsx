import React, { useState, useEffect } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOES, COLORS, TetrominoType } from '@/lib/tetris';

interface TetrisBoardProps {
  board: (TetrominoType | null)[][];
  currentPiece: {
    type: TetrominoType;
    position: { x: number; y: number };
    rotation: number;
  } | null;
}

export function TetrisBoard({ board, currentPiece }: TetrisBoardProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="border-4 border-gray-800 bg-gray-900 p-2 rounded-lg">
        <div className="w-[250px] h-[500px] bg-gray-800 rounded"></div>
      </div>
    );
  }

  // 현재 조각을 보드에 오버레이하여 렌더링
  const getCellContent = (x: number, y: number) => {
    // 보드에 고정된 블록이 있는지 확인
    if (board[y][x] !== null) {
      return board[y][x];
    }

    // 현재 조각이 있는지 확인
    if (currentPiece) {
      const tetromino = TETROMINOES[currentPiece.type];
      let rotated = [...tetromino];
      
      // 회전 적용
      for (let i = 0; i < currentPiece.rotation; i++) {
        rotated = rotated[0].map((_, index) => rotated.map(row => row[index]).reverse());
      }
      
      for (let i = 0; i < rotated.length; i++) {
        for (let j = 0; j < rotated[i].length; j++) {
          if (rotated[i][j]) {
            const boardX = currentPiece.position.x + j;
            const boardY = currentPiece.position.y + i;
            
            if (boardX === x && boardY === y) {
              return currentPiece.type;
            }
          }
        }
      }
    }

    return null;
  };

  return (
    <div className="border-4 border-gray-800 bg-gray-900 p-2 rounded-lg">
      <div 
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
          width: `${BOARD_WIDTH * 25}px`,
          height: `${BOARD_HEIGHT * 25}px`,
        }}
      >
        {Array.from({ length: BOARD_HEIGHT }, (_, y) =>
          Array.from({ length: BOARD_WIDTH }, (_, x) => {
            const cellType = getCellContent(x, y);
            return (
              <div
                key={`${x}-${y}`}
                className={`
                  w-6 h-6 border border-gray-700
                  ${cellType ? COLORS[cellType] : 'bg-gray-800'}
                  ${cellType ? 'shadow-inner' : ''}
                `}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
