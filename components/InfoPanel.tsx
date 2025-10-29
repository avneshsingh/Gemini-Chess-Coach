import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface InfoPanelProps {
  status: string;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isChatLoading: boolean;
  onNewGame: () => void;
  onSendMessage: (message: string) => void;
}

const AnalysisLoader: React.FC = () => (
  <div className="flex items-center justify-center gap-3 text-gray-400 h-full">
    <div
      className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
    <span>Gemini is analyzing the board...</span>
  </div>
);

const ChatLoader: React.FC = () => (
  <div className="flex justify-start">
      <div className="p-3 rounded-lg bg-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"></div>
          </div>
      </div>
  </div>
);


const InfoPanel: React.FC<InfoPanelProps> = ({ status, chatHistory, isLoading, isChatLoading, onNewGame, onSendMessage }) => {
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="w-full max-w-md lg:max-w-sm xl:max-w-md bg-gray-800 p-6 rounded-lg shadow-2xl space-y-4 flex flex-col">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <p className="font-semibold text-gray-300">Game Status:</p>
          <p className="text-lg text-white font-medium">{status}</p>
        </div>
        <button
          onClick={onNewGame}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isChatLoading}
        >
          New Game
        </button>
      </div>
      
      <div className="flex flex-col flex-grow min-h-0">
        <p className="font-semibold text-gray-300 mb-2 flex-shrink-0">Gemini's Analysis:</p>
        <div ref={chatContainerRef} className="p-4 bg-gray-900 rounded-md text-gray-200 text-sm border border-gray-700 flex-grow overflow-y-auto space-y-4 min-h-[250px] max-h-[400px]">
          {isLoading ? (
            <AnalysisLoader />
          ) : (
            <>
              {chatHistory.map((chat, index) => (
                  <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-xs md:max-w-sm whitespace-pre-wrap ${chat.role === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-700'}`}>
                          {chat.message}
                      </div>
                  </div>
              ))}
              {isChatLoading && <ChatLoader />}
            </>
          )}
        </div>
      </div>
       {chatHistory.length > 0 && !isLoading && (
        <form onSubmit={handleSendMessage} className="flex gap-2 mt-2 flex-shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="flex-grow bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            disabled={isChatLoading}
          />
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isChatLoading || !chatInput.trim()}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default InfoPanel;