import React from 'react';

interface LikertScaleProps {
  question: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function LikertScale({ question, value, onChange, disabled }: LikertScaleProps) {
  const options = [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly Agree' }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
        {question}
      </h3>
      
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${value === option.value 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="likert"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <div className="ml-4">
              <div className="font-medium text-gray-900">{option.label}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}