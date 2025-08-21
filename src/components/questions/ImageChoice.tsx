import React from 'react';
import { getImageUrl } from '../../data/imageAssets';

interface ImageChoiceProps {
  question: string;
  options: string[];
  assetKeys?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ImageChoice({ question, options, assetKeys, value, onChange, disabled }: ImageChoiceProps) {
  // Parse asset keys if provided
  const imageKeys = assetKeys?.replace('img:', '').split(',').map(k => k.trim()) || options;
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
        {question}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {imageKeys.map((key, index) => {
          const optionValue = options[index] || key;
          const isSelected = value === optionValue;
          
          return (
            <label
              key={key}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-105
                ${isSelected 
                  ? 'ring-4 ring-blue-500 shadow-lg' 
                  : 'ring-2 ring-gray-200 hover:ring-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="image-choice"
                value={optionValue}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div className="aspect-square">
                <img
                  src={getImageUrl(key)}
                  alt={optionValue}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2 bg-white">
                <p className="text-sm font-medium text-gray-900 text-center capitalize">
                  {optionValue.replace(/_/g, ' ')}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}