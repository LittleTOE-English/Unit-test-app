export enum AppState {
  WELCOME = 'WELCOME',
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface AssessmentResult {
  pronunciationScore: number; // 1-5
  grammarScore: number; // 1-5
  relevanceScore: number; // 1-5
  transcription: string;
  feedback: string;
  sticker: string; // Emoji or short reward text
}

export interface Question {
  id: number;
  text: string;
  hint?: string;
}

export interface SessionHistoryItem extends AssessmentResult {
  questionId: number;
  questionText: string;
  timestamp: string;
}