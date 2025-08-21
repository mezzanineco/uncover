import React from 'react';

interface WordChoiceMultiProps {
  question: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  maxSelections?: number;
}

export function WordChoiceMulti({ 
  question, 
  options, 
  value, 
  onChange, 
  disabled, 
  maxSelections = 2 
}: WordChoiceMultiProps) {
  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      // Remove if already selected
      onChange(value.filter(v => v !== option));
    } else if (value.length < maxSelections) {
      // Add if under limit
      onChange([...value, option]);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
        {question}
      </h3>
      
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Select up to {maxSelections} options ({value.length}/{maxSelections} selected)
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((option) => {
          const isSelected = value.includes(option);
          const canSelect = value.length < maxSelections || isSelected;
          
          return (
            <button
              key={option}
              onClick={() => handleToggle(option)}
              disabled={disabled || !canSelect}
              className={`
                inline-flex items-center px-6 py-3 rounded-full transition-all duration-200 transform hover:scale-105
                ${isSelected 
                  ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' 
                  : canSelect
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="font-medium">{option}</span>
              {isSelected && (
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}