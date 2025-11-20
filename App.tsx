import React, { useState, useEffect, useCallback } from 'react';
import { AppState, AssessmentResult, Question, SessionHistoryItem } from './types';
import { QUESTIONS } from './constants';
import { analyzeSpeaking } from './services/geminiService';
import Recorder from './components/Recorder';
import ResultCard from './components/ResultCard';
import { Volume2, Loader2, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Thinking...");
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);

  const currentQuestion: Question = QUESTIONS[currentQuestionIndex];

  const handleNextQuestion = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setCurrentQuestionIndex((prev) => (prev + 1) % QUESTIONS.length);
  };

  const handleRetry = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    // Index stays the same to repeat the question
  };

  const speakQuestion = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for kids
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQuestion]);

  // Auto-speak question when it changes
  useEffect(() => {
    if (appState === AppState.IDLE) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => speakQuestion(), 500);
      return () => clearTimeout(timer);
    }
  }, [appState, currentQuestionIndex, speakQuestion]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setAppState(AppState.ANALYZING);
    const messages = ["Listening closely...", "Checking grammar...", "Preparing stickers..."];
    let msgIdx = 0;
    const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % messages.length;
        setLoadingMessage(messages[msgIdx]);
    }, 1500);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const assessment = await analyzeSpeaking(base64Audio, currentQuestion.text);
      
      setResult(assessment);
      
      // Add to history
      const historyItem: SessionHistoryItem = {
        ...assessment,
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        timestamp: new Date().toLocaleString()
      };
      setHistory(prev => [...prev, historyItem]);
      
      setAppState(AppState.RESULT);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    } finally {
        clearInterval(interval);
    }
  };

  const downloadExcel = () => {
    if (history.length === 0) {
        alert("No results to export yet!");
        return;
    }

    // 1. Calculate Averages for the Chart
    const total = history.length;
    const avgPron = history.reduce((sum, item) => sum + item.pronunciationScore, 0) / total;
    const avgGram = history.reduce((sum, item) => sum + item.grammarScore, 0) / total;
    const avgRel = history.reduce((sum, item) => sum + item.relevanceScore, 0) / total;

    // Data structured specifically for the requested Chart
    // Horizontal Axis (Rows): Criteria
    // Vertical Axis (Values): Average Score
    const chartData = [
      { "Criteria": "Pronunciation", "Average Score": Number(avgPron.toFixed(2)) },
      { "Criteria": "Grammar", "Average Score": Number(avgGram.toFixed(2)) },
      { "Criteria": "Relevance (Right Answer)", "Average Score": Number(avgRel.toFixed(2)) },
    ];

    // 2. Prepare Detailed Data
    const detailData = history.map(item => ({
        "Question": item.questionText,
        "Pronunciation": item.pronunciationScore,
        "Grammar": item.grammarScore,
        "Relevance": item.relevanceScore,
        "Student Said": item.transcription,
        "Feedback": item.feedback,
        "Time": item.timestamp
    }));

    // Create worksheets
    const wsChart = XLSX.utils.json_to_sheet(chartData);
    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    
    // Set column widths for better readability
    wsChart['!cols'] = [{ wch: 25 }, { wch: 15 }];
    wsDetail['!cols'] = [
        { wch: 30 }, // Question
        { wch: 15 }, // Pronunciation
        { wch: 15 }, // Grammar
        { wch: 15 }, // Relevance
        { wch: 40 }, // Transcription
        { wch: 40 }, // Feedback
        { wch: 20 }  // Time
    ];

    const wb = XLSX.utils.book_new();
    // Append the Chart Data sheet first so it's the first thing seen
    XLSX.utils.book_append_sheet(wb, wsChart, "Chart Data");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detailed Results");

    // Generate file name with date
    const dateStr = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `LittleTOEs_Report_${dateStr}.xlsx`);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
      case AppState.RECORDING:
        return (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-grape-500 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="inline-block bg-grape-100 text-grape-700 px-4 py-1 rounded-full text-sm font-bold mb-4">
                Question {currentQuestion.id}
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4 leading-tight">
                {currentQuestion.text}
              </h1>
              <button 
                onClick={speakQuestion}
                className="text-grape-500 hover:text-grape-700 transition-colors p-2 bg-grape-50 rounded-full"
                aria-label="Listen to question"
              >
                <Volume2 size={32} />
              </button>
              {currentQuestion.hint && (
                <p className="text-gray-400 mt-4 text-sm font-medium">
                  Hint: "{currentQuestion.hint}"
                </p>
              )}
            </div>

            <Recorder onRecordingComplete={handleRecordingComplete} />
          </div>
        );

      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl shadow-xl max-w-sm w-full">
            <Loader2 className="animate-spin text-grape-500 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-gray-700 animate-pulse">{loadingMessage}</h3>
          </div>
        );

      case AppState.RESULT:
        return result ? (
          <ResultCard 
            result={result} 
            onNext={handleNextQuestion} 
            onRetry={handleRetry} 
          />
        ) : null;

      case AppState.ERROR:
        return (
           <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-red-200 text-center">
              <div className="text-5xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-red-500 mb-2">Oops!</h2>
              <p className="text-gray-600 mb-6">Something went wrong. Let's try that again.</p>
              <button
                onClick={() => setAppState(AppState.IDLE)}
                className="w-full py-3 bg-grape-500 text-white rounded-xl font-bold shadow hover:bg-grape-600"
              >
                Try Again
              </button>
           </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-grape-100 flex flex-col items-center justify-center p-4 relative">
      <header className="absolute top-6 left-0 w-full text-center z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-grape-700 drop-shadow-sm tracking-tight">
          Little TOEs 👣
        </h1>
      </header>
      
      <main className="w-full flex justify-center items-center flex-grow pt-16 pb-6 z-0">
        {renderContent()}
      </main>
      
      <footer className="w-full max-w-md flex justify-between items-center text-gray-400 text-sm pb-4 px-4">
        <span>Powered by Gemini AI</span>
        
        {history.length > 0 && (
            <button 
                onClick={downloadExcel}
                className="flex items-center gap-2 bg-white text-green-600 px-3 py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all border border-green-100 font-bold text-xs"
            >
                <FileSpreadsheet size={16} />
                Download Report
            </button>
        )}
      </footer>
    </div>
  );
};

export default App;