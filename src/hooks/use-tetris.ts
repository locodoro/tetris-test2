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
    console.log('🎮 Initializing game state');
    setGameState(createInitialGameState());
    console.log('✅ Game state initialized');
  }, []);

  // 게임 속도 계산
  const getDropTime = useCallback((level: number) => {
    const dropTime = Math.max(100, 1000 - (level - 1) * 100);
    console.log('⏱️ Drop time for level', level, ':', dropTime, 'ms');
    return dropTime;
  }, []);

  // 게임 시작
  const startGame = useCallback(() => {
    console.log('🚀 Starting new game');
    setGameState(createInitialGameState());
    setDropTime(getDropTime(1));
    console.log('✅ New game started');
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
    setGameState(prev => {
      if (!prev || prev.gameOver || prev.paused || !prev.currentPiece) return prev;
      return movePieceInState(prev, 0, 1);
    });
  }, []);

  // 키보드 이벤트 처리
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    console.log('🔍 Key pressed:', event.code, 'Key:', event.key);
    
    if (typeof window === 'undefined') {
      console.log('❌ Window is undefined, returning early');
      return;
    }
    
    // 게임 상태 체크
    setGameState(prev => {
      if (!prev) {
        console.log('❌ Game state is null');
        return prev;
      }
      
      if (prev.gameOver) {
        console.log('❌ Game is over');
        return prev;
      }
      
      if (prev.paused) {
        console.log('❌ Game is paused');
        return prev;
      }

      console.log('✅ Processing key:', event.code);
      
      // 이벤트 처리
      switch (event.code) {
        case 'ArrowLeft':
          console.log('⬅️ Moving left');
          event.preventDefault();
          break;
        case 'ArrowRight':
          console.log('➡️ Moving right');
          event.preventDefault();
          break;
        case 'ArrowDown':
          console.log('⬇️ Moving down');
          event.preventDefault();
          break;
        case 'ArrowUp':
          console.log('⬆️ Rotating');
          event.preventDefault();
          break;
        case 'Space':
          console.log('⬇️ Hard drop');
          event.preventDefault();
          break;
        case 'KeyP':
          console.log('⏸️ Toggle pause');
          event.preventDefault();
          break;
        default:
          console.log('❓ Unknown key:', event.code);
      }
      
      return prev;
    });
    
    // setGameState 외부에서 실제 액션 실행
    setTimeout(() => {
      setGameState(currentState => {
        if (!currentState || currentState.gameOver || currentState.paused) {
          return currentState;
        }
        
        switch (event.code) {
          case 'ArrowLeft':
            return movePieceInState(currentState, -1, 0);
          case 'ArrowRight':
            return movePieceInState(currentState, 1, 0);
          case 'ArrowDown':
            return movePieceInState(currentState, 0, 1);
          case 'ArrowUp':
            return rotatePieceInState(currentState);
          case 'Space':
            return hardDropInState(currentState);
          case 'KeyP':
            return { ...currentState, paused: !currentState.paused };
          default:
            return currentState;
        }
      });
    }, 0);
  }, []);

  // 상태 내에서 조각 이동 함수
  const movePieceInState = (state: GameState, dx: number, dy: number): GameState => {
    if (!state.currentPiece) return state;

    const newPosition = {
      x: state.currentPiece.position.x + dx,
      y: state.currentPiece.position.y + dy,
    };

    if (!isCollision(state.board, { ...state.currentPiece, position: newPosition })) {
      return {
        ...state,
        currentPiece: { ...state.currentPiece, position: newPosition },
      };
    }

    // 충돌이 발생하고 아래로 이동하려고 했을 때
    if (dy > 0) {
      const newBoard = placePiece(state.board, state.currentPiece);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      const newLines = state.lines + linesCleared;
      const newLevel = calculateLevel(newLines);
      const scoreIncrease = calculateScore(linesCleared, state.level);

      // 게임 오버 검사
      if (isGameOver(clearedBoard)) {
        return { ...state, gameOver: true };
      }

      return {
        ...state,
        board: clearedBoard,
        currentPiece: null,
        lines: newLines,
        level: newLevel,
        score: state.score + scoreIncrease,
      };
    }

    return state;
  };

  // 상태 내에서 조각 회전 함수
  const rotatePieceInState = (state: GameState): GameState => {
    if (!state.currentPiece) return state;

    const newRotation = (state.currentPiece.rotation + 1) % 4;
    const rotatedPiece = { ...state.currentPiece, rotation: newRotation };

    if (!isCollision(state.board, rotatedPiece)) {
      return {
        ...state,
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
        x: state.currentPiece.position.x + kick.x,
        y: state.currentPiece.position.y + kick.y,
      };

      if (!isCollision(state.board, { ...rotatedPiece, position: kickedPosition })) {
        return {
          ...state,
          currentPiece: { ...rotatedPiece, position: kickedPosition },
        };
      }
    }

    return state;
  };

  // 상태 내에서 하드 드롭 함수
  const hardDropInState = (state: GameState): GameState => {
    if (!state.currentPiece) return state;

    const { position, linesCleared } = hardDrop(state.board, state.currentPiece);
    const newBoard = placePiece(state.board, { ...state.currentPiece, position });
    const { newBoard: clearedBoard } = clearLines(newBoard);
    const newLines = state.lines + linesCleared;
    const newLevel = calculateLevel(newLines);
    const scoreIncrease = calculateScore(linesCleared, state.level);

    if (isGameOver(clearedBoard)) {
      return { ...state, gameOver: true };
    }

    return {
      ...state,
      board: clearedBoard,
      currentPiece: null,
      lines: newLines,
      level: newLevel,
      score: state.score + scoreIncrease,
    };
  };

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
    console.log('🎯 Setting up keyboard event listener');
    
    if (typeof window !== 'undefined') {
      console.log('✅ Window is available, adding event listener');
      window.addEventListener('keydown', handleKeyPress);
      
      // 테스트용 이벤트 리스너 추가
      const testHandler = (e: KeyboardEvent) => {
        console.log('🧪 Test event listener triggered:', e.code);
      };
      window.addEventListener('keydown', testHandler);
      
      return () => {
        console.log('🧹 Cleaning up keyboard event listeners');
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('keydown', testHandler);
      };
    } else {
      console.log('❌ Window is not available');
    }
  }, [handleKeyPress]);

  return {
    gameState,
    startGame,
    togglePause,
  };
}

// 랜덤 테트로미노 생성 함수 (타입 오류 해결용)
function getRandomTetromino(): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return types[Math.floor(Math.random() * types.length)];
}
