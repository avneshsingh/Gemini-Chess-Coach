import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ChessInstance, ChatMessage } from '../types';
import ChessboardComponent from '../components/ChessboardComponent';
import InfoPanel from '../components/InfoPanel';
import GameSetup from '../components/GameSetup';
import { getChessAdvice } from '../services/geminiService';
import { GoogleGenAI, Chat } from "@google/genai";

type GameMode = 'pve' | 'pvp';
type PlayerColor = 'w' | 'b';

const App: React.FC = () => {
  const game = useRef<ChessInstance | null>(null);
  const chatSession = useRef<Chat | null>(null);
  
  const [gameConfig, setGameConfig] = useState<{ mode: GameMode; playerColor: PlayerColor; } | null>(null);

  const [fen, setFen] = useState('start');
  const [status, setStatus] = useState('Initializing...');
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for conversational chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const updateStatus = useCallback(() => {
    if (!game.current) return;
    let newStatus = game.current.turn() === 'b' ? 'Black to move' : 'White to move';

    if (game.current.in_checkmate()) {
      newStatus = `Checkmate! ${game.current.turn() === 'w' ? 'Black' : 'White'} wins.`;
    } else if (game.current.in_draw()) {
      newStatus = 'Draw!';
    } else if (game.current.game_over()){
      newStatus = 'Game over.';
    } else if (game.current.in_check()) {
      newStatus += ' - Check!';
    }
    setStatus(newStatus);
  }, []);

  const fetchAdvice = useCallback(async () => {
    if (!game.current) {
        setIsLoading(false);
        return;
    }

    if (game.current.game_over()) {
      setIsLoading(false);
      setChatHistory([{ role: 'model', message: 'The game is over. Start a new game to get more advice!' }]);
      return;
    };

    setIsLoading(true);
    setChatHistory([]); // Clear previous chat
    try {
      const history = game.current.history({verbose: true});
      const lastMove = history.length > 0 ? history[history.length - 1].san : "none";
      const newAdvice = await getChessAdvice(game.current.fen(), game.current.pgn(), lastMove);
      
      setChatHistory([{ role: 'model', message: newAdvice }]);

      // Initialize a new chat session with context
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      chatSession.current = ai.chats.create({
          model: 'gemini-2.5-pro',
          history: [
            { role: 'user', parts: [{ text: `Analyze this chess position (FEN): ${game.current.fen()}` }] },
            { role: 'model', parts: [{ text: newAdvice }] },
          ],
          systemInstruction: 'You are a world-class chess grandmaster and a friendly, encouraging coach. The user is asking follow-up questions about the analysis you just provided. Keep your answers concise and helpful.',
      });

    } catch (error) {
      console.error("Error fetching advice:", error);
      const errorMessage = error instanceof Error ? `⚠️ Gemini API Error: ${error.message}` : 'An unknown error occurred.';
      setChatHistory([{ role: 'model', message: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendChatMessage = async (message: string) => {
    if (!chatSession.current || !message.trim()) return;

    setIsChatLoading(true);
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', message }];
    setChatHistory(updatedHistory);

    try {
        const response = await chatSession.current.sendMessage({ message });
        setChatHistory(prev => [...prev, { role: 'model', message: response.text }]);
    } catch (error) {
        console.error("Error sending chat message:", error);
        const errorMessage = error instanceof Error ? `⚠️ Gemini API Error: ${error.message}` : 'An unknown error occurred.';
        setChatHistory(prev => [...prev, { role: 'model', message: errorMessage }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const makeBotMove = useCallback(async () => {
    if (!game.current || !gameConfig || gameConfig.mode !== 'pve' || game.current.game_over()) {
      return;
    }

    setIsLoading(true);
    setChatHistory([]); // Clear chat for bot's turn
    try {
      const history = game.current.history({verbose: true});
      const lastMove = history.length > 0 ? history[history.length - 1].san : "none";
      const botAdvice = await getChessAdvice(game.current.fen(), game.current.pgn(), lastMove);
      
      const moveMatch = botAdvice.match(/\*\*Best Move:\*\*\s*(\S+)/i);
      const bestMove = moveMatch ? moveMatch[1] : null;

      if (bestMove) {
        const moveResult = game.current.move(bestMove);
        if(moveResult) {
            setFen(game.current.fen());
            updateStatus();
        } else {
            console.error("Gemini suggested an illegal move:", bestMove);
            setChatHistory([{role: 'model', message: `⚠️ Gemini suggested an illegal move (${bestMove}). It's still your turn.`}]);
            setIsLoading(false);
            return;
        }
      } else {
        setChatHistory([{role: 'model', message: "⚠️ Gemini couldn't decide on a move. It's your turn."}]);
        setIsLoading(false);
        return;
      }
      
      await fetchAdvice();

    } catch (error) {
       console.error("Error during bot move:", error);
       const errorMessage = error instanceof Error ? `⚠️ Gemini API Error: ${error.message}` : 'An unknown error occurred.';
       setChatHistory([{role: 'model', message: errorMessage}]);
    }
  }, [gameConfig, fetchAdvice, updateStatus]);

  
  const handleEndGame = useCallback(() => {
    setGameConfig(null);
    setFen('start');
    setStatus('Initializing...');
    setChatHistory([]);
    chatSession.current = null;
  }, []);

  const handleDrop = useCallback((
    source: string,
    target: string,
  ): 'snapback' | void => {
    if (!game.current || game.current.game_over()) return 'snapback';
    
    if (gameConfig?.mode === 'pve' && game.current.turn() !== gameConfig.playerColor) {
      return 'snapback';
    }

    try {
      const move = game.current.move({
        from: source,
        to: target,
        promotion: 'q'
      });

      if (move === null) return 'snapback';

      setFen(game.current.fen());
      updateStatus();
      
      if (gameConfig?.mode === 'pve') {
        setTimeout(() => makeBotMove(), 500);
      } else {
        fetchAdvice();
      }
      return;

    } catch(e) {
      return 'snapback';
    }
  }, [updateStatus, gameConfig, makeBotMove, fetchAdvice]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (typeof window.Chess === 'function' && !game.current) {
        clearInterval(intervalId);
        game.current = new window.Chess();
        setStatus('Ready to start a new game.');
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, []);


  const handleStartGame = useCallback((mode: GameMode, playerColor: PlayerColor) => {
    if (!game.current) return;
    
    game.current = new (window.Chess)();
    setFen(game.current.fen());
    updateStatus();
    setChatHistory([]);
    chatSession.current = null;
    
    // Set the game config. The bot's first move will be triggered by a useEffect.
    setGameConfig({ mode, playerColor });

    // Fetch initial advice only if it's the player's turn to move first.
    if (mode === 'pvp' || (mode === 'pve' && playerColor === 'w')) {
      fetchAdvice();
    }
  }, [updateStatus, fetchAdvice]);

  // This new effect reliably triggers the bot's first move when the player chooses black.
  useEffect(() => {
    // Check if the game is configured for a PvE match, the player is Black,
    // it's White's (the bot's) turn, and it's the very beginning of the game.
    if (
      gameConfig &&
      gameConfig.mode === 'pve' &&
      gameConfig.playerColor === 'b' &&
      game.current?.turn() === 'w' &&
      game.current?.history().length === 0
    ) {
      // A short delay makes it feel like the bot is "thinking" and allows UI to render.
      const timer = setTimeout(() => {
        makeBotMove();
      }, 500);

      // Cleanup the timer if the component re-renders or unmounts.
      return () => clearTimeout(timer);
    }
  }, [gameConfig, makeBotMove]);


  return (
    <div className="bg-gray-900 text-white min-h-screen w-full flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
       <h1 className="text-3xl lg:text-4xl font-bold text-cyan-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] my-4 text-center">Gemini Chess Coach</h1>
      {!gameConfig ? (
        <div className="flex-grow flex items-center justify-center">
          <GameSetup onStartGame={handleStartGame} />
        </div>
      ) : (
        <div className="w-full flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8">
          <ChessboardComponent
            position={fen}
            onDrop={handleDrop}
            orientation={gameConfig.playerColor === 'w' ? 'white' : 'black'}
          />
          <InfoPanel
            status={status}
            chatHistory={chatHistory}
            isLoading={isLoading}
            isChatLoading={isChatLoading}
            onNewGame={handleEndGame}
            onSendMessage={handleSendChatMessage}
          />
        </div>
      )}
    </div>
  );
};

export default App;