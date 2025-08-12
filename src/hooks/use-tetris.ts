import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  createInitialGameState,
  spawnNewPiece,
  isCollision,
  placePiece,
  clearLines,
  calculateScore,
  calculateLevel,
  isGameOver,
  hardDrop,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TetrominoType,
} from '@/lib/tetris';

export function useTetris() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [dropTime, setDropTime] = useState<number>(1000);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const dropTimeRef = useRef<NodeJS.Timeout | null>(null);

  // 클라이언트에서만 초기 상태 설정
  useEffect(() => {
    setGameState(createInitialGameState());
  }, []);

  // 게임 속도 계산
  const getDropTime = useCallback((level: number) => {
    return Math.max(100, 1000 - (level - 1) * 100);
  }, []);

  // 게임 시작
  const startGame = useCallback(() => {
    setGameState(createInitialGameState());
    setDropTime(getDropTime(1));
  }, [getDropTime]);

  // 게임 일시정지/재개
  const togglePause = useCallback(() => {
    setGameState(prev => prev ? { ...prev, paused: !prev.paused } : null);
  }, []);

  // 새로운 조각 생성
  const spawnPiece = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      
      // 현재 nextPiece를 currentPiece로 사용
      const newPiece = {
        type: prev.nextPiece,
        position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
        rotation: 0,
      };
      
      return {
        ...prev,
        currentPiece: newPiece,
        nextPiece: getRandomTetromino(),
      };
    });
  }, []);

  // 조각 이동
  const movePiece = useCallback((dx: number, dy: number) => {
    setGameState(prev => {
      if (!prev || prev.gameOver || prev.paused || !prev.currentPiece) return prev;

      const newPosition = {
        x: prev.currentPiece.position.x + dx,
        y: prev.currentPiece.position.y + dy,
      };

      if (!isCollision(prev.board, { ...prev.currentPiece, position: newPosition })) {
        return {
          ...prev,
          currentPiece: { ...prev.currentPiece, position: newPosition },
        };
      }

      // 충돌이 발생하고 아래로 이동하려고 했을 때
      if (dy > 0) {
        const newBoard = placePiece(prev.board, prev.currentPiece);
        const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
        const newLines = prev.lines + linesCleared;
        const newLevel = calculateLevel(newLines);
        const scoreIncrease = calculateScore(linesCleared, prev.level);

        // 게임 오버 검사
        if (isGameOver(clearedBoard)) {
          return { ...prev, gameOver: true };
        }

        return {
          ...prev,
          board: clearedBoard,
          currentPiece: null,
          lines: newLines,
          level: newLevel,
          score: prev.score + scoreIncrease,
        };
      }

      return prev;
    });
  }, []);

  // 조각 회전
  const rotatePiece = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.gameOver || prev.paused || !prev.currentPiece) return prev;

      const newRotation = (prev.currentPiece.rotation + 1) % 4;
      const rotatedPiece = { ...prev.currentPiece, rotation: newRotation };

      if (!isCollision(prev.board, rotatedPiece)) {
        return {
          ...prev,
          currentPiece: rotatedPiece,
        };
      }

      // 벽 킥 (wall kick) 시도
      const kicks = [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: -1, y: -1 },
        { x: 1, y: -1 },
      ];

      for (const kick of kicks) {
        const kickedPosition = {
          x: prev.currentPiece.position.x + kick.x,
          y: prev.currentPiece.position.y + kick.y,
        };

        if (!isCollision(prev.board, { ...rotatedPiece, position: kickedPosition })) {
          return {
            ...prev,
            currentPiece: { ...rotatedPiece, position: kickedPosition },
          };
        }
      }

      return prev;
    });
  }, []);

  // 하드 드롭
  const hardDropPiece = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.gameOver || prev.paused || !prev.currentPiece) return prev;
      const { position, linesCleared } = hardDrop(prev.board, prev.currentPiece);
      const newBoard = placePiece(prev.board, { ...prev.currentPiece, position });
      const { newBoard: clearedBoard } = clearLines(newBoard);
      const newLines = prev.lines + linesCleared;
      const newLevel = calculateLevel(newLines);
      const scoreIncrease = calculateScore(linesCleared, prev.level);

      if (isGameOver(clearedBoard)) {
        return { ...prev, gameOver: true };
      }

      return {
        ...prev,
        board: clearedBoard,
        currentPiece: null,
        lines: newLines,
        level: newLevel,
        score: prev.score + scoreIncrease,
      };
    });
  }, []);

  // 자동 하강
  const dropPiece = useCallback(() => {
    movePiece(0, 1);
  }, [movePiece]);

  // 키보드 이벤트 처리
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (typeof window === 'undefined') return;
    
    setGameState(prev => {
      if (!prev || prev.gameOver) return prev;

      switch (event.code) {
        case 'ArrowLeft':
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          event.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          rotatePiece();
          break;
        case 'Space':
          event.preventDefault();
          hardDropPiece();
          break;
        case 'KeyP':
          event.preventDefault();
          togglePause();
          break;
      }
      return prev;
    });
  }, [movePiece, rotatePiece, hardDropPiece, togglePause]);

  // 게임 루프
  useEffect(() => {
    if (!gameState || gameState.gameOver || gameState.paused) {
      if (dropTimeRef.current) {
        clearInterval(dropTimeRef.current);
        dropTimeRef.current = null;
      }
      return;
    }

    // 새로운 조각이 필요하면 생성
    if (!gameState.currentPiece) {
      spawnPiece();
    }

    // 자동 하강 설정
    dropTimeRef.current = setInterval(() => {
      dropPiece();
    }, dropTime);

    return () => {
      if (dropTimeRef.current) {
        clearInterval(dropTimeRef.current);
      }
    };
  }, [gameState, dropTime, spawnPiece, dropPiece]);

  // 레벨에 따른 속도 조정
  useEffect(() => {
    if (gameState) {
      setDropTime(getDropTime(gameState.level));
    }
  }, [gameState, getDropTime]);

  // 키보드 이벤트 리스너
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [handleKeyPress]);

  return {
    gameState,
    startGame,
    togglePause,
    movePiece,
    rotatePiece,
    hardDropPiece,
  };
}

// 랜덤 테트로미노 생성 함수 (타입 오류 해결용)
function getRandomTetromino(): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return types[Math.floor(Math.random() * types.length)];
}
