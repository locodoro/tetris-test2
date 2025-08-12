import React from 'react';
import { Button } from '@/components/ui/button';
import { TetrisBoard } from './tetris-board';
import { NextPiece } from './next-piece';
import { GameInfo } from './game-info';
import { GameOverModal } from './game-over-modal';
import { ControlsGuide } from './controls-guide';
import { useTetris } from '@/hooks/use-tetris';

export function TetrisGame() {
  const { gameState, startGame, togglePause } = useTetris();

  // 게임 상태가 로드되지 않았으면 로딩 표시
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-white text-xl">게임 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 게임 보드 */}
        <div className="flex flex-col items-center">
          <TetrisBoard 
            board={gameState.board} 
            currentPiece={gameState.currentPiece} 
          />
          
          {/* 게임 시작/일시정지 버튼 */}
          <div className="mt-4 flex gap-2">
            {!gameState.gameOver && (
              <Button
                onClick={togglePause}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {gameState.paused ? '재개' : '일시정지'}
              </Button>
            )}
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              새 게임
            </Button>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="flex flex-col gap-4 w-48">
          <GameInfo 
            score={gameState.score} 
            level={gameState.level} 
            lines={gameState.lines} 
          />
          <NextPiece nextPiece={gameState.nextPiece} />
          <ControlsGuide />
        </div>
      </div>

      {/* 게임 오버 모달 */}
      {gameState.gameOver && (
        <GameOverModal
          score={gameState.score}
          level={gameState.level}
          lines={gameState.lines}
          onRestart={startGame}
        />
      )}
    </div>
  );
}
