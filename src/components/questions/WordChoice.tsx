import React from 'react';

interface WordChoiceProps {
  question: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function WordChoice({ question, options, value, onChange, disabled }: WordChoiceProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
        {question}
      </h3>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((option) => (
          <label
            key={option}
            className={`
              inline-flex items-center px-6 py-3 rounded-full cursor-pointer transition-all duration-200 transform hover:scale-105
              ${value === option 
                ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="word-choice"
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="sr-only"
            />
            <span className="font-medium">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}