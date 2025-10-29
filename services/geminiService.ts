
import { GoogleGenAI } from "@google/genai";

// This check is to prevent crashing in non-browser environments or if the API key isn't set.
if (!process.env.API_KEY) {
  // In a real app, you might throw an error or handle this more gracefully.
  console.warn("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Fetches chess advice from the Gemini API based on the current board state.
 * @param fen The Forsyth-Edwards Notation string of the current board position.
 * @param pgn The Portable Game Notation string of the game so far.
 * @param lastMove The last move made in Standard Algebraic Notation (e.g., "Nf3").
 * @returns A string containing the chess advice.
 */
export async function getChessAdvice(fen: string, pgn: string, lastMove: string): Promise<string> {
  const model = "gemini-2.5-pro";
  
  const prompt = `
    You are a world-class chess grandmaster and a friendly, encouraging coach.
    Analyze the following chess position.

    Current board state (FEN): ${fen}
    Game history (PGN): ${pgn}
    The last move played was: ${lastMove}

    Your task is to:
    1.  Suggest the best next move for the current player. Provide the move in Standard Algebraic Notation (e.g., "e4", "Nf3", "Bxg7").
    2.  Explain the reasoning behind your suggestion in 2-3 concise, beginner-friendly sentences.
    3.  Focus on the strategic goals, tactical opportunities, or defensive necessities.
    4.  Keep your tone positive and educational.

    Format your response clearly, like this:
    **Best Move:** [Your suggested move]

    **Reasoning:** [Your explanation]
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    // Using response.text for direct text extraction as per latest guidelines
    return response.text;

  } catch (error) {
    console.error("Gemini API call failed:", error);
    // Re-throw the error to be handled by the calling component
    if (error instanceof Error) {
        throw new Error(`Failed to get advice from Gemini: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}
