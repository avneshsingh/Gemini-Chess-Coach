import React, { useState } from 'react';

type GameMode = 'pve' | 'pvp';
type PlayerColor = 'w' | 'b';

interface GameSetupProps {
  onStartGame: (mode: GameMode, color: PlayerColor) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [mode, setMode] = useState<GameMode>('pve');
  const [color, setColor] = useState<PlayerColor>('w');

  const handleStart = () => {
    onStartGame(mode, color);
  };
  
  const buttonClasses = (isActive: boolean) =>
    `px-6 py-3 text-lg font-semibold rounded-lg transition-all duration-200 ease-in-out w-full focus:outline-none focus:ring-4 focus:ring-cyan-500/50`;
  
  const activeClasses = 'bg-cyan-500 text-white shadow-lg scale-105';
  const inactiveClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md mx-auto flex flex-col gap-8 text-center animate-fade-in">
      <h1 className="text-4xl font-bold text-cyan-400">New Game Setup</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-300">1. Choose Game Mode</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('pve')}
            className={`${buttonClasses(mode === 'pve')} ${mode === 'pve' ? activeClasses : inactiveClasses}`}
          >
            Play vs Gemini
          </button>
          <button
            onClick={() => setMode('pvp')}
            className={`${buttonClasses(mode === 'pvp')} ${mode === 'pvp' ? activeClasses : inactiveClasses}`}
          >
            Play vs Friend
          </button>
        </div>
      </div>

      {mode === 'pve' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-300">2. Choose Your Color</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setColor('w')}
              className={`${buttonClasses(color === 'w')} ${color === 'w' ? activeClasses : inactiveClasses}`}
            >
              White
            </button>
            <button
              onClick={() => setColor('b')}
              className={`${buttonClasses(color === 'b')} ${color === 'b' ? activeClasses : inactiveClasses}`}
            >
              Black
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleStart}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        Start Game
      </button>
    </div>
  );
};

export default GameSetup;
