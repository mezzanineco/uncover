import React from 'react';
import type { ParsedQuestion } from '../../types';

interface ScenarioQuestionProps {
  question: ParsedQuestion;
  selectedAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
}

export function ScenarioQuestion({ question, selectedAnswer, onAnswerSelect }: ScenarioQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-gray-800 leading-relaxed">
          {question.question}
        </p>
      </div>
      
      <div className="space-y-3">
        {question.parsedOptions?.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(option)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedAnswer === option
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium text-gray-900">
              {String.fromCharCode(65 + index)}.
            </span>
            <span className="ml-3 text-gray-800">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}