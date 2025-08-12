// 테트로미노 블록 타입 정의
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// 블록 모양 정의
export const TETROMINOES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// 블록 색상 정의
export const COLORS = {
  I: 'bg-cyan-500',
  O: 'bg-yellow-500',
  T: 'bg-purple-500',
  S: 'bg-green-500',
  Z: 'bg-red-500',
  J: 'bg-blue-500',
  L: 'bg-orange-500',
};

// 게임 보드 크기
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// 게임 상태 타입
export interface GameState {
  board: (TetrominoType | null)[][];
  currentPiece: {
    type: TetrominoType;
    position: { x: number; y: number };
    rotation: number;
  } | null;
  nextPiece: TetrominoType;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
}

// 초기 게임 상태
export const createInitialGameState = (): GameState => ({
  board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
  currentPiece: null,
  nextPiece: getRandomTetromino(),
  score: 0,
  level: 1,
  lines: 0,
  gameOver: false,
  paused: false,
});

// 랜덤 테트로미노 생성
export function getRandomTetromino(): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return types[Math.floor(Math.random() * types.length)];
}

// 테트로미노 회전
export function rotateTetromino(piece: number[][], rotation: number): number[][] {
  let rotated = [...piece];
  for (let i = 0; i < rotation; i++) {
    rotated = rotated[0].map((_, index) => rotated.map(row => row[index]).reverse());
  }
  return rotated;
}

// 새로운 조각 생성
export function spawnNewPiece(): { type: TetrominoType; position: { x: number; y: number }; rotation: number } {
  return {
    type: getRandomTetromino(),
    position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
    rotation: 0,
  };
}

// 충돌 검사
export function isCollision(
  board: (TetrominoType | null)[][],
  piece: { type: TetrominoType; position: { x: number; y: number }; rotation: number }
): boolean {
  const tetromino = rotateTetromino(TETROMINOES[piece.type], piece.rotation);
  
  for (let y = 0; y < tetromino.length; y++) {
    for (let x = 0; x < tetromino[y].length; x++) {
      if (tetromino[y][x]) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;
        
        if (
          boardX < 0 || 
          boardX >= BOARD_WIDTH || 
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX] !== null)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// 조각을 보드에 고정
export function placePiece(
  board: (TetrominoType | null)[][],
  piece: { type: TetrominoType; position: { x: number; y: number }; rotation: number }
): (TetrominoType | null)[][] {
  const newBoard = board.map(row => [...row]);
  const tetromino = rotateTetromino(TETROMINOES[piece.type], piece.rotation);
  
  for (let y = 0; y < tetromino.length; y++) {
    for (let x = 0; x < tetromino[y].length; x++) {
      if (tetromino[y][x]) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.type;
        }
      }
    }
  }
  return newBoard;
}

// 완성된 라인 제거
export function clearLines(board: (TetrominoType | null)[][]): {
  newBoard: (TetrominoType | null)[][];
  linesCleared: number;
} {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_HEIGHT - newBoard.length;
  
  // 제거된 라인만큼 빈 라인 추가
  for (let i = 0; i < linesCleared; i++) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  
  return { newBoard, linesCleared };
}

// 점수 계산
export function calculateScore(linesCleared: number, level: number): number {
  const lineScores = [0, 100, 300, 500, 800];
  return lineScores[linesCleared] * level;
}

// 레벨 계산
export function calculateLevel(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

// 게임 오버 검사
export function isGameOver(board: (TetrominoType | null)[][]): boolean {
  return board[0].some(cell => cell !== null);
}

// 하드 드롭 (즉시 하강)
export function hardDrop(
  board: (TetrominoType | null)[][],
  piece: { type: TetrominoType; position: { x: number; y: number }; rotation: number }
): { position: { x: number; y: number }; linesCleared: number } {
  let newPosition = { ...piece.position };
  
  while (!isCollision(board, { ...piece, position: { ...newPosition, y: newPosition.y + 1 } })) {
    newPosition.y++;
  }
  
  const newBoard = placePiece(board, { ...piece, position: newPosition });
  const { linesCleared } = clearLines(newBoard);
  
  return { position: newPosition, linesCleared };
}
