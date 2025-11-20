import React from 'react';
import { AssessmentResult } from '../types';
import { Star, MessageCircle, Ear, SpellCheck, RotateCcw, ArrowRight } from 'lucide-react';

interface ResultCardProps {
  result: AssessmentResult;
  onNext: () => void;
  onRetry: () => void;
}

const StarRating: React.FC<{ score: number; max?: number; color?: string }> = ({ score, max = 5, color = "text-yellow-400" }) => {
  return (
    <div className="flex space-x-1">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          size={24}
          className={`${i < score ? `${color} fill-current` : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const ResultCard: React.FC<ResultCardProps> = ({ result, onNext, onRetry }) => {
  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-lime-400 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="bg-lime-400 p-6 text-center">
        <div className="text-6xl mb-2 animate-bounce">{result.sticker}</div>
        <h2 className="text-2xl font-bold text-white drop-shadow-md">Great Job!</h2>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Transcription */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 mb-1 uppercase font-bold tracking-wider">You said:</p>
          <p className="text-lg text-gray-800 italic">"{result.transcription}"</p>
        </div>

        {/* Scores */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-700 font-semibold">
              <Ear className="text-grape-500" size={20} />
              <span>Sound</span>
            </div>
            <StarRating score={result.pronunciationScore} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-700 font-semibold">
              <SpellCheck className="text-blue-500" size={20} />
              <span>Grammar</span>
            </div>
            <StarRating score={result.grammarScore} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-700 font-semibold">
              <MessageCircle className="text-green-500" size={20} />
              <span>Answer</span>
            </div>
            <StarRating score={result.relevanceScore} />
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
          <p className="text-sky-800 font-medium text-center">
            {result.feedback}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
            <button
                onClick={onRetry}
                className="flex-1 py-3 bg-white border-2 border-grape-400 text-grape-600 hover:bg-grape-50 font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center space-x-2"
            >
                <RotateCcw size={20} />
                <span>Try Again</span>
            </button>

            <button
                onClick={onNext}
                className="flex-1 py-3 bg-grape-500 hover:bg-grape-600 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center space-x-2"
            >
                <span>Next</span>
                <ArrowRight size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;