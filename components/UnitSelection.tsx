import React, { useState } from 'react';
import { User, BookOpen, Play } from 'lucide-react';

interface UnitSelectionProps {
  onStart: (name: string, unit: number) => void;
}

const UnitSelection: React.FC<UnitSelectionProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<number>(1);

  const handleStartClick = () => {
    if (!name.trim()) {
      alert("Please tell me your name first! 😊");
      return;
    }
    onStart(name, selectedUnit);
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-grape-500 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-grape-700 mb-2">Welcome to Little TOEs! 👣</h2>
        <p className="text-gray-500">Let's get ready to speak English.</p>
      </div>

      {/* Name Input */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2 pl-1" htmlFor="username">
          What is your name?
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="text-grape-400" size={20} />
          </div>
          <input
            id="username"
            type="text"
            placeholder="Enter student name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grape-500 focus:ring focus:ring-grape-200 transition-all outline-none text-lg"
          />
        </div>
      </div>

      {/* Unit Dropdown */}
      <div className="mb-8">
        <label className="block text-gray-700 text-sm font-bold mb-2 pl-1" htmlFor="unit-select">
          Select Unit
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="text-lime-500" size={20} />
            </div>
            <select
                id="unit-select"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(Number(e.target.value))}
                className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-lime-500 focus:ring focus:ring-lime-200 transition-all outline-none text-lg appearance-none bg-white cursor-pointer"
            >
                {Array.from({ length: 40 }, (_, i) => i + 1).map((unit) => (
                    <option key={unit} value={unit}>
                        Unit {unit}
                    </option>
                ))}
            </select>
            {/* Custom Chevron Arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartClick}
        className="w-full py-4 bg-grape-600 hover:bg-grape-700 text-white text-xl font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ring-4 ring-grape-100"
      >
        <span>Start Test</span>
        <Play size={24} fill="currentColor" />
      </button>
    </div>
  );
};

export default UnitSelection;