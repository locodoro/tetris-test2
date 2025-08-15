"use client";
import React, { useState, useEffect } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOES, COLORS, TetrominoType, rotateTetromino, getGhostPosition, GameEffects } from '@/lib/tetris';
import { ScorePopupComponent } from '@/components/ui/score-popup';

interface TetrisBoardProps {
  board: (TetrominoType | null)[][];
  currentPiece: {
    type: TetrominoType;
    position: { x: number; y: number };
    rotation: number;
  } | null;
  effects?: GameEffects;
}

export function TetrisBoard({ board, currentPiece, effects }: TetrisBoardProps) {
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

  // 현재 조각과 고스트를 보드에 오버레이하여 렌더링
  type CellRender = { type: TetrominoType | null; ghost: boolean };
  const getCellContent = (x: number, y: number): CellRender => {
    // 보드에 고정된 블록이 있는지 확인
    if (board[y][x] !== null) {
      return { type: board[y][x], ghost: false };
    }

    // 현재 조각이 있는지 확인
    if (currentPiece) {
      const rotated = rotateTetromino(TETROMINOES[currentPiece.type], currentPiece.rotation);
      
      for (let i = 0; i < rotated.length; i++) {
        for (let j = 0; j < rotated[i].length; j++) {
          if (rotated[i][j]) {
            const boardX = currentPiece.position.x + j;
            const boardY = currentPiece.position.y + i;
            
            if (boardX === x && boardY === y) {
              return { type: currentPiece.type, ghost: false };
            }
          }
        }
      }

      // 고스트(착지 가이드) 렌더링
      const ghostPos = getGhostPosition(board, currentPiece);
      for (let i = 0; i < rotated.length; i++) {
        for (let j = 0; j < rotated[i].length; j++) {
          if (rotated[i][j]) {
            const boardX = ghostPos.x + j;
            const boardY = ghostPos.y + i;

            if (boardX === x && boardY === y) {
              return { type: currentPiece.type, ghost: true };
            }
          }
        }
      }
    }

    return { type: null, ghost: false };
  };

  const widthPx = BOARD_WIDTH * 25;
  const heightPx = BOARD_HEIGHT * 25;

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 좌클릭: 열 계산해서 하드드롭 목표로 전달하는 커스텀 이벤트 발생
    if (e.button !== 0) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.max(0, Math.min(BOARD_WIDTH - 1, Math.floor(x / 25)));
    const event = new CustomEvent('tetris:column-hard-drop', { detail: { col } });
    window.dispatchEvent(event);
  };

  return (
    <div className="border-4 border-gray-800 bg-gray-900 p-2 rounded-lg">
      <div className="relative" style={{ width: `${widthPx}px`, height: `${heightPx}px` }} onMouseDown={handleBoardClick}>
        <div 
          className="grid gap-0 absolute inset-0"
          style={{
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
          }}
        >
          {Array.from({ length: BOARD_HEIGHT }, (_, y) =>
            Array.from({ length: BOARD_WIDTH }, (_, x) => {
              const { type: solidType, ghost: isGhost } = getCellContent(x, y);
              return (
                <div
                  key={`${x}-${y}`}
                  className={`
                    w-6 h-6 border border-gray-700
                    ${solidType ? COLORS[solidType] : 'bg-gray-800'}
                    ${solidType ? 'shadow-inner' : ''}
                  `}
                  style={isGhost ? { opacity: 0.2 } : undefined}
                />
              );
            })
          )}
        </div>

        {/* 오버레이: 라인 플래시, 하드 드롭 애니메이션 및 점수 팝업 */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {effects?.clearingRows?.map((row) => (
            <div
              key={`row-${row}`}
              className="absolute left-0 right-0 ux-row-flash"
              style={{ top: row * 25, height: 25 }}
            />
          ))}

          {/* 개별 블록별 세로 트레일 (실제 블록 경로만) */}
          {effects?.verticalTrails?.map((trail) => (
            <div
              key={trail.id}
              className="absolute ux-vertical-trail"
              style={{ 
                left: trail.x * 25,
                top: trail.y * 25,
                width: 25, // 1칸 너비
                height: trail.h * 25,
                zIndex: 3
              }}
            />
          ))}



          {effects?.scorePopups?.map((popup) => (
            <ScorePopupComponent key={popup.id} popup={popup} />
          ))}

          {/* 콤보 애니메이션 */}
          {effects?.comboAnimation && (
            <div
              className="absolute font-bold text-purple-300 text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ux-combo-animation"
              style={{
                left: '50%',
                top: '30%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            >
              {effects.comboAnimation.comboCount}x COMBO!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
