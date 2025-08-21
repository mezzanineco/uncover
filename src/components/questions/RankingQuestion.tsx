import React, { useState } from 'react';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

interface RankingQuestionProps {
  question: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function RankingQuestion({ question, options, value, onChange, disabled }: RankingQuestionProps) {
  // Initialize with options if value is empty
  const rankedItems = value.length > 0 ? value : [...options];

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    
    const newRanking = [...rankedItems];
    const [movedItem] = newRanking.splice(fromIndex, 1);
    newRanking.splice(toIndex, 0, movedItem);
    onChange(newRanking);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveItem(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < rankedItems.length - 1) {
      moveItem(index, index + 1);
    }
  };

  const getRankLabel = (index: number) => {
    const labels = ['1st', '2nd', '3rd', '4th', '5th'];
    return labels[index] || `${index + 1}th`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
        {question}
      </h3>
      
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Drag items or use the arrow buttons to rank them in order of priority
        </p>
      </div>
      
      <div className="space-y-3 max-w-2xl mx-auto">
        {rankedItems.map((item, index) => (
          <div
            key={item}
            className={`
              flex items-center p-4 bg-white rounded-lg border-2 transition-all duration-200
              ${disabled ? 'opacity-50' : 'hover:shadow-md'}
              border-gray-200
            `}
          >
            <div className="flex items-center mr-4">
              <GripVertical className="w-5 h-5 text-gray-400 mr-2" />
              <div className="flex flex-col items-center">
                <button
                  onClick={() => moveUp(index)}
                  disabled={disabled || index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={disabled || index === rankedItems.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{item}</span>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {getRankLabel(index)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}