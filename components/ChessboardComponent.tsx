import React, { useRef, useEffect } from 'react';
import type { ChessboardInstance, ChessboardConfig } from '../types';

interface ChessboardComponentProps {
  position: string;
  onDrop: (source: string, target: string) => 'snapback' | void | undefined;
  orientation: 'white' | 'black';
}

const ChessboardComponent: React.FC<ChessboardComponentProps> = ({ position, onDrop, orientation }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const board = useRef<ChessboardInstance | null>(null);

  // Initialize the chessboard instance on component mount
  useEffect(() => {
    if (!boardRef.current) {
      return;
    }

    const intervalId = setInterval(() => {
      if (window.Chessboard && boardRef.current && !board.current) {
        clearInterval(intervalId);
        
        const config: ChessboardConfig = {
          draggable: true,
          position: 'start',
          onDrop: (source, target) => onDrop(source, target), // Simplified handler
          orientation: orientation,
          pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
        };
        board.current = window.Chessboard(boardRef.current, config);
        // Ensure initial position is set correctly
        board.current.position(position, false);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [onDrop, orientation]);

  // Update the board position whenever the 'position' prop changes.
  useEffect(() => {
    if (board.current && board.current.fen() !== position) {
      board.current.position(position, false);
    }
  }, [position]);

  return <div ref={boardRef} className="w-[320px] sm:w-[480px] md:w-[560px] lg:w-[600px] shadow-2xl rounded-lg" />;
};

export default ChessboardComponent;
