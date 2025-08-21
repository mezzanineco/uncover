import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  currentSection: 'Broad' | 'Clarifier' | 'Validator';
  sectionProgress: {
    broad: { completed: number; total: number };
    clarifier: { completed: number; total: number };
    validator: { completed: number; total: number };
  };
  className?: string;
}

export function ProgressBar({ 
  current, 
  total, 
  currentSection, 
  sectionProgress, 
  className = '' 
}: ProgressBarProps) {
  const overallPercentage = (current / total) * 100;
  
  // Calculate section percentages within the overall progress
  const totalQuestions = sectionProgress.broad.total + sectionProgress.clarifier.total + sectionProgress.validator.total;
  const broadWidth = (sectionProgress.broad.total / totalQuestions) * 100;
  const clarifierWidth = (sectionProgress.clarifier.total / totalQuestions) * 100;
  const validatorWidth = (sectionProgress.validator.total / totalQuestions) * 100;
  
  // Calculate completed percentages for each section
  const broadCompleted = (sectionProgress.broad.completed / totalQuestions) * 100;
  const clarifierCompleted = (sectionProgress.clarifier.completed / totalQuestions) * 100;
  const validatorCompleted = (sectionProgress.validator.completed / totalQuestions) * 100;

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'broad': return currentSection === 'Broad' ? 'bg-blue-500' : 'bg-blue-400';
      case 'clarifier': return currentSection === 'Clarifier' ? 'bg-amber-500' : 'bg-amber-400';
      case 'validator': return currentSection === 'Validator' ? 'bg-green-500' : 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'broad': return 'Broad';
      case 'clarifier': return 'Clarifier';
      case 'validator': return 'Validator';
      default: return '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Question {current} of {total}</span>
        <span>{Math.round(overallPercentage)}% Complete</span>
      </div>
      
      {/* Section Labels */}
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${getSectionColor('broad')}`}></div>
          <span className={currentSection === 'Broad' ? 'font-semibold text-blue-600' : ''}>
            Broad ({sectionProgress.broad.completed}/{sectionProgress.broad.total})
          </span>
        </div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${getSectionColor('clarifier')}`}></div>
          <span className={currentSection === 'Clarifier' ? 'font-semibold text-amber-600' : ''}>
            Clarifier ({sectionProgress.clarifier.completed}/{sectionProgress.clarifier.total})
          </span>
        </div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${getSectionColor('validator')}`}></div>
          <span className={currentSection === 'Validator' ? 'font-semibold text-green-600' : ''}>
            Validator ({sectionProgress.validator.completed}/{sectionProgress.validator.total})
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
        {/* Broad Section */}
        <div 
          className="h-full flex"
          style={{ width: `${broadWidth}%` }}
        >
          <div 
            className={`h-full ${getSectionColor('broad')} transition-all duration-500 ease-out`}
            style={{ width: `${sectionProgress.broad.total > 0 ? (sectionProgress.broad.completed / sectionProgress.broad.total) * 100 : 0}%` }}
          />
          <div className="h-full bg-gray-300 flex-1" />
        </div>
        
        {/* Clarifier Section */}
        <div 
          className="h-full flex border-l border-white"
          style={{ width: `${clarifierWidth}%` }}
        >
          <div 
            className={`h-full ${getSectionColor('clarifier')} transition-all duration-500 ease-out`}
            style={{ width: `${sectionProgress.clarifier.total > 0 ? (sectionProgress.clarifier.completed / sectionProgress.clarifier.total) * 100 : 0}%` }}
          />
          <div className="h-full bg-gray-300 flex-1" />
        </div>
        
        {/* Validator Section */}
        <div 
          className="h-full flex border-l border-white"
          style={{ width: `${validatorWidth}%` }}
        >
          <div 
            className={`h-full ${getSectionColor('validator')} transition-all duration-500 ease-out`}
            style={{ width: `${sectionProgress.validator.total > 0 ? (sectionProgress.validator.completed / sectionProgress.validator.total) * 100 : 0}%` }}
          />
          <div className="h-full bg-gray-300 flex-1" />
        </div>
      </div>
      
      {/* Current Section Indicator */}
      <div className="text-center mt-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          Current: {getSectionLabel(currentSection.toLowerCase())} Section
        </span>
      </div>
    </div>
  );
}