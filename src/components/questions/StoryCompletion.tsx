import React from 'react';

interface StoryCompletionProps {
  question: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StoryCompletion({ question, options, value, onChange, disabled }: StoryCompletionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 leading-relaxed mb-2">
          Complete the Story
        </h3>
        <p className="text-gray-600">{question}</p>
      </div>
      
      <div className="space-y-3 max-w-3xl mx-auto">
        {options.map((option, index) => (
          <label
            key={index}
            className={`
              flex items-start p-5 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${value === option 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="story-completion"
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 mt-0.5 flex-shrink-0"
            />
            <div className="ml-4">
              <div className="text-gray-900 leading-relaxed">
                <span className="font-medium">...{option}</span>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}