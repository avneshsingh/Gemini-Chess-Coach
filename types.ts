// This file is for global type declarations, especially for libraries loaded via CDN.

export interface ChessboardConfig {
  draggable?: boolean;
  position?: string | { [key: string]: string };
  onDrop?: (source: string, target: string) => 'snapback' | void;
  [key: string]: any;
}

export interface ChessboardInstance {
  position: (fen: string, useAnimation?: boolean) => string;
  fen: () => string;
  [key: string]: any;
}

// Define the structure of the Chess.js instance
export interface ChessInstance {
  fen: () => string;
  move: (move: string | { from: string; to: string; promotion?: string; }) => any;
  turn: () => 'w' | 'b';
  in_checkmate: () => boolean;
  in_draw: () => boolean;
  game_over: () => boolean;
  in_check: () => boolean;
  history: (options?: { verbose: boolean }) => any[];
  pgn: () => string;
}

// Type for chat messages
export interface ChatMessage {
  role: 'user' | 'model';
  message: string;
}


declare global {
  interface Window {
    Chessboard: (elementId: string | HTMLElement, config: ChessboardConfig) => ChessboardInstance;
    Chess: new (fen?: string) => ChessInstance;
  }
}