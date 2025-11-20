import React, { useState, useEffect, useCallback } from 'react';
import { AppState, AssessmentResult, Question, SessionHistoryItem } from './types';
import { QUESTIONS } from './constants';
import { analyzeSpeaking } from './services/geminiService';
import Recorder from './components/Recorder';
import ResultCard from './components/ResultCard';
import { Volume2, Loader2, Download, FileSpreadsheet, User, Play } from 'lucide-react';
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
  // Change initial state to WELCOME
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Thinking...");
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  
  // New state for student name
  const [studentName, setStudentName] = useState("");

  const currentQuestion: Question = QUESTIONS[currentQuestionIndex];

  const handleStartSession = () => {
    if (studentName.trim()) {
      setAppState(AppState.IDLE);
    } else {
      alert("Please enter your name first! / Con hãy nhập tên trước nhé!");
    }
  };

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
    const chartData = [
      { "Info": "Student Name", "Value": studentName },
      { "Info": "Date", "Value": new Date().toLocaleDateString() },
      { "Info": "", "Value": "" }, // Spacer
      { "Info": "Criteria", "Value": "Average Score" }, // Pseudo-header for chart
      { "Info": "Pronunciation", "Value": Number(avgPron.toFixed(2)) },
      { "Info": "Grammar", "Value": Number(avgGram.toFixed(2)) },
      { "Info": "Relevance (Right Answer)", "Value": Number(avgRel.toFixed(2)) },
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
    const wsChart = XLSX.utils.json_to_sheet(chartData, { skipHeader: true });
    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    
    // Set column widths
    wsChart['!cols'] = [{ wch: 25 }, { wch: 20 }];
    wsDetail['!cols'] = [
        { wch: 30 }, 
        { wch: 15 }, 
        { wch: 15 }, 
        { wch: 15 }, 
        { wch: 40 }, 
        { wch: 40 }, 
        { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsChart, "Summary & Chart");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detailed Results");

    // Generate file name with Student Name and Date
    const dateStr = new Date().toISOString().slice(0,10);
    const safeName = studentName.replace(/[^a-z0-9]/gi, '_'); // Remove special chars for filename
    XLSX.writeFile(wb, `LittleTOEs_${safeName}_${dateStr}.xlsx`);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.WELCOME:
        return (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-grape-400 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
               <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={40} className="text-lime-600" />
               </div>
               <h2 className="text-2xl font-bold text-grape-700">Hello Friend!</h2>
               <p className="text-gray-500">What is your name?</p>
            </div>

            <div className="space-y-6">
                <input 
                    type="text" 
                    placeholder="My name is..."
                    className="w-full p-4 text-lg text-center border-2 border-grape-200 rounded-2xl focus:border-grape-500 focus:ring-2 focus:ring-grape-200 outline-none transition-all text-grape-800 font-bold"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartSession()}
                />
                
                <button
                    onClick={handleStartSession}
                    className="w-full py-4 bg-grape-500 hover:bg-grape-600 text-white text-xl font-bold rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                    <span>Let's Start!</span>
                    <Play fill="currentColor" size={20} />
                </button>
            </div>
          </div>
        );

      case AppState.IDLE:
      case AppState.RECORDING:
        return (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-grape-500 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="flex justify-between items-center mb-4">
                <div className="inline-block bg-grape-100 text-grape-700 px-4 py-1 rounded-full text-sm font-bold">
                    Question {currentQuestion.id}
                </div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {studentName}
                </div>
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
                Report
            </button>
        )}
      </footer>
    </div>
  );
};

export default App;