// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
  calculateHardDropScore,
  calculateComboScore,
  getPieceWidth,
  getPieceStartX,
  getPieceStartY,
  rotateTetromino,
  TETROMINOES,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TetrominoType,
  getFullRowIndices,
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
        
        // 콤보 시스템 처리
        let newComboCount = prev.comboCount;
        let scoreIncrease = calculateScore(linesCleared, prev.level);
        let comboAnimation: any = undefined;
        
        if (linesCleared > 0) {
          // 라인 클리어 시 콤보 증가
          newComboCount = prev.comboCount + 1;
          scoreIncrease = calculateComboScore(scoreIncrease, prev.comboCount);
          
          // 콤보 애니메이션 효과 (콤보 카운트가 2 이상일 때)
          if (newComboCount >= 2) {
            comboAnimation = {
              id: Math.random().toString(36).slice(2),
              comboCount: newComboCount,
              t: Date.now(),
            };
          }
        } else {
          // 라인 클리어 없이 조각 고정 시 콤보 리셋
          newComboCount = 0;
        }

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
          comboCount: newComboCount,
          score: prev.score + scoreIncrease,
          effects: {
            ...(prev.effects ?? { clearingRows: [], scorePopups: [], hardDropAnimating: false }),
            comboAnimation,
          },
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
      
      const { position, linesCleared, dropDistance } = hardDrop(prev.board, prev.currentPiece);
      const hardDropScore = calculateHardDropScore(dropDistance);
      const lineClearScore = calculateScore(linesCleared, prev.level);
      const totalScore = hardDropScore + lineClearScore;
      
      const newBoard = placePiece(prev.board, { ...prev.currentPiece, position });
      const { newBoard: clearedBoard } = clearLines(newBoard);
      const newLines = prev.lines + linesCleared;
      const newLevel = calculateLevel(newLines);

      if (isGameOver(clearedBoard)) {
        return { ...prev, gameOver: true };
      }

      // 하드 드롭 애니메이션 효과 설정
      const centerX = Math.floor(BOARD_WIDTH / 2);
      const centerY = position.y;

      const nextEffects = {
        ...(prev.effects ?? { clearingRows: [], scorePopups: [], hardDropAnimating: false }),
        hardDropAnimating: true,
        scorePopups: [
          ...(prev.effects?.scorePopups ?? []),
          { 
            id: Math.random().toString(36).slice(2), 
            value: totalScore, 
            x: centerX, 
            y: centerY, 
            t: Date.now(),
            type: 'hard-drop',
            label: 'HARD DROP'
          },
        ],
      };

      // 애니메이션 후 실제 상태 업데이트
      setTimeout(() => {
        setGameState(currentState => {
          if (!currentState) return currentState;
          return {
            ...currentState,
            board: clearedBoard,
            currentPiece: null,
            lines: newLines,
            level: newLevel,
            score: currentState.score + totalScore,
            effects: { 
              ...(currentState.effects ?? { clearingRows: [], scorePopups: [], hardDropAnimating: false }), 
              hardDropAnimating: false 
            },
          };
        });
      }, 300);

      return { ...prev, effects: nextEffects };
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
        
        // 애니메이션 중일 때 입력 무시
        if (currentState.effects && 
            (currentState.effects.clearingRows.length > 0 || currentState.effects.hardDropAnimating)) {
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

  // 보드 클릭으로 컬럼 하드드롭 트리거
  useEffect(() => {
    const onColumnHardDrop = (e: Event) => {
      const detail = (e as CustomEvent).detail as { col: number };
      setGameState(prev => {
        if (!prev || prev.paused || prev.gameOver || !prev.currentPiece) return prev;
        const dx = detail.col - prev.currentPiece.position.x;
        const moved = movePieceInState(prev, dx, 0);
        return hardDropInState(moved);
      });
    };
    window.addEventListener('tetris:column-hard-drop', onColumnHardDrop as EventListener);
    return () => window.removeEventListener('tetris:column-hard-drop', onColumnHardDrop as EventListener);
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

    // 충돌이 발생하고 아래로 이동하려고 했을 때: 라인 플래시/점수 팝업 애니메이션 후 커밋
    if (dy > 0) {
      const preBoard = placePiece(state.board, state.currentPiece);
      const fullRows = getFullRowIndices(preBoard);

      if (fullRows.length === 0) {
        // 라인 클리어 없음: 즉시 고정
        if (isGameOver(preBoard)) {
          return { ...state, gameOver: true };
        }
        return { ...state, board: preBoard, currentPiece: null };
      }

      // 효과 설정: 라인 플래시, 점수 팝업(보드 중앙 라인 기준)
      const baseScore = calculateScore(fullRows.length, state.level);
      const centerX = Math.floor(BOARD_WIDTH / 2);
      const centerY = fullRows[Math.floor(fullRows.length / 2)];

      const nextEffects = {
        ...(state.effects ?? { clearingRows: [], scorePopups: [], hardDropAnimating: false }),
        clearingRows: fullRows,
        scorePopups: [
          ...(state.effects?.scorePopups ?? []),
          { 
            id: Math.random().toString(36).slice(2), 
            value: baseScore, 
            x: centerX, 
            y: centerY, 
            t: Date.now(),
            type: 'line-clear'
          },
        ],
      };

      // 애니메이션 후 실제 클리어 커밋
      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          const appliedBoard = placePiece(prev.board, prev.currentPiece!);
          const { newBoard: clearedBoard, linesCleared } = clearLines(appliedBoard);
          const newLines = prev.lines + linesCleared;
          const newLevel = calculateLevel(newLines);
          const added = calculateScore(linesCleared, prev.level);

          if (isGameOver(clearedBoard)) {
            return { ...prev, gameOver: true };
          }

          return {
            ...prev,
            board: clearedBoard,
            currentPiece: null,
            lines: newLines,
            level: newLevel,
            score: prev.score + added,
            effects: { ...(prev.effects ?? { clearingRows: [], scorePopups: [], hardDropAnimating: false }), clearingRows: [] },
          };
        });
      }, 220);

      return { ...state, effects: nextEffects };
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

  // 상태 내에서 하드 드롭 함수 - 클래식 즉시 착지
  const hardDropInState = (state: GameState): GameState => {
    if (!state.currentPiece) return state;

    console.log('🚀 Classic hard drop starting');
    
    // 드롭 거리 포함 계산 및 라인 클리어 동시 처리
    const { position, linesCleared, dropDistance } = hardDrop(state.board, state.currentPiece);
    const hardDropScore = calculateHardDropScore(dropDistance);
    let lineClearScore = calculateScore(linesCleared, state.level);
    
    // 콤보 시스템 처리
    let newComboCount = state.comboCount;
    let comboAnimation: any = undefined;
    
    if (linesCleared > 0) {
      // 라인 클리어 시 콤보 증가 및 점수 보정
      newComboCount = state.comboCount + 1;
      lineClearScore = calculateComboScore(lineClearScore, state.comboCount);
      
      // 콤보 애니메이션 효과 (콤보 카운트가 2 이상일 때)
      if (newComboCount >= 2) {
        comboAnimation = {
          id: Math.random().toString(36).slice(2),
          comboCount: newComboCount,
          t: Date.now(),
        };
      }
    } else {
      // 라인 클리어 없이 조각 고정 시 콤보 리셋
      newComboCount = 0;
    }
    
    const totalScore = hardDropScore + lineClearScore;

    // 즉시 보드에 커밋
    const preBoard = placePiece(state.board, { ...state.currentPiece, position });
    const { newBoard: clearedBoard } = clearLines(preBoard);
    const newLines = state.lines + linesCleared;
    const newLevel = calculateLevel(newLines);

    if (isGameOver(clearedBoard)) {
      return { ...state, gameOver: true };
    }

    // 팝업 위치: 보드 중앙 X, 착지 Y
    const centerX = Math.floor(BOARD_WIDTH / 2);
    const centerY = position.y;

    // X좌표별 통합 트레일 계산 - 일관된 밝기
    const tetromino = rotateTetromino(TETROMINOES[state.currentPiece.type], state.currentPiece.rotation);
    const columnTrails = new Map(); // X좌표별로 Y 범위 저장
    
    // 각 실제 블록의 위치 수집
    for (let y = 0; y < tetromino.length; y++) {
      for (let x = 0; x < tetromino[y].length; x++) {
        if (tetromino[y][x]) { // 실제 블록(1)인 경우만
          const blockCurrentY = state.currentPiece.position.y + y;
          const blockDroppedY = position.y + y + 1; // 블록 아래쪽까지 포함
          const blockX = position.x + x;
          
          if (blockDroppedY > blockCurrentY) {
            if (!columnTrails.has(blockX)) {
              columnTrails.set(blockX, { minY: blockCurrentY, maxY: blockDroppedY });
            } else {
              const existing = columnTrails.get(blockX);
              existing.minY = Math.min(existing.minY, blockCurrentY);
              existing.maxY = Math.max(existing.maxY, blockDroppedY);
            }
          }
        }
      }
    }
    
    // X좌표별로 통합된 트레일 생성
    const unifiedTrails = [];
    for (const [x, range] of columnTrails) {
      unifiedTrails.push({
        id: Math.random().toString(36).slice(2),
        x: x,
        y: range.minY,
        h: range.maxY - range.minY,
        t: Date.now(),
      });
    }
    
    console.log('🔍 Unified column trails:', {
      type: state.currentPiece.type,
      rotation: state.currentPiece.rotation,
      columnCount: columnTrails.size,
      trails: unifiedTrails
    });
    
    const nextEffects = {
      ...(state.effects ?? { clearingRows: [], scorePopups: [], hardDropAnimating: false }),
      verticalTrails: unifiedTrails,
      comboAnimation,
      scorePopups: [
        ...(state.effects?.scorePopups ?? []),
        {
          id: Math.random().toString(36).slice(2),
          value: totalScore,
          x: centerX,
          y: centerY,
          t: Date.now(),
          type: 'hard-drop',
          label: 'HARD DROP',
        },
      ],
    };

    console.log('✨ Classic effects set:', nextEffects);
    
    // 즉시 커밋 + 이펙트
    return {
      ...state,
      board: clearedBoard,
      currentPiece: null,
      lines: newLines,
      level: newLevel,
      comboCount: newComboCount,
      score: state.score + totalScore,
      effects: nextEffects,
    };
  };

  // 게임 루프
  useEffect(() => {
    if (!gameState || gameState.gameOver || gameState.paused || 
        (gameState.effects && gameState.effects.clearingRows.length > 0) ||
        (gameState.effects && gameState.effects.hardDropAnimating)) {
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

  // 드롭 이펙트 자동 정리
  useEffect(() => {
    const id = setInterval(() => {
      setGameState(prev => {
        if (!prev?.effects) return prev;
        const now = Date.now();
        const hasPopups = prev.effects.scorePopups?.length > 0;
        const hasTrails = prev.effects.verticalTrails?.length > 0;
        const hasComboAnimation = prev.effects.comboAnimation && (now - prev.effects.comboAnimation.t < 2000);
        
        if (!hasPopups && !hasTrails && !hasComboAnimation) return prev;
        
        return {
          ...prev,
          effects: {
            ...(prev.effects || { clearingRows: [], scorePopups: [], hardDropAnimating: false }),
            scorePopups: prev.effects.scorePopups?.filter(p => now - p.t < 1200) || [],
            verticalTrails: prev.effects.verticalTrails?.filter(t => now - t.t < 150) || [],
            comboAnimation: hasComboAnimation ? prev.effects.comboAnimation : undefined,
          }
        };
      });
    }, 20);
    return () => clearInterval(id);
  }, []);

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
