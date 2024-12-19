export class Board {
  Id: number;
  Size: number;
  Solution: number[];
  Colors: BoardCell[][];
  IsSolved: boolean;
}

export class BoardCell {
  id: number;
  row: number;
  column: number;
  color: number;
  isCheck: number;
  isQueen: boolean
  isError: boolean;
  ScreenX: number;
  ScreenXMax: number;
  ScreenY: number;
  ScreenYMax: number;
  IsAutoCheck: boolean;
  BorderTop: boolean;
  BorderRight: boolean;
}

export class Game {
  Id: number;
  IsSolution: boolean;
}

