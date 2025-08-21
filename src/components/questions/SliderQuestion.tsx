import React from 'react';

interface SliderQuestionProps {
  question: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function SliderQuestion({ question, value, onChange, disabled }: SliderQuestionProps) {
  const labels = [
    'Strongly Disagree',
    'Disagree',
    'Somewhat Disagree', 
    'Neutral',
    'Somewhat Agree',
    'Agree',
    'Strongly Agree'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
        {question}
      </h3>
      
      <div className="space-y-4">
        <div className="px-4">
          <input
            type="range"
            min="1"
            max="7"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - 1) / 6) * 100}%, #e5e7eb ${((value - 1) / 6) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {[1, 2, 3, 4, 5, 6, 7].map(num => (
              <span key={num} className={value === num ? 'font-semibold text-blue-600' : ''}>
                {num}
              </span>
            ))}
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 mr-2">Your response:</span>
            <span className="text-lg font-semibold text-blue-600">{labels[value - 1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}