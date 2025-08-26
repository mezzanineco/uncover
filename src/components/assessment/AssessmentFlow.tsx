import React, { useState, useEffect } from 'react';
import type { ParsedQuestion, Response, AssessmentResult } from '../../types';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';
import { calculateArchetypeScores, calculateConfidenceScore } from '../../utils/scoring';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AssessmentFlowProps {
  questions: ParsedQuestion[];
  onComplete: (result: AssessmentResult) => void;
  onBackToDashboard?: () => void;
  title: string;
  description: string;
  initialResponses?: Response[];
  initialQuestionIndex?: number;
  onProgressUpdate?: (responses: Response[], questionIndex: number) => void;
}

export function AssessmentFlow({ 
  questions, 
  onComplete, 
  onBackToDashboard, 
  title, 
  description,
  initialResponses = [],
  initialQuestionIndex = 0,
  onProgressUpdate
}: AssessmentFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [responses, setResponses] = useState<Response[]>(initialResponses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState<'Broad' | 'Clarifier' | 'Validator'>('Broad');

  // Organize questions by section
  const broadQuestions = questions.filter(q => q.category === 'Broad');
  const clarifierQuestions = questions.filter(q => q.category === 'Clarifier');
  const validatorQuestions = questions.filter(q => q.category === 'Validator');
  
  const allSectionQuestions = [...broadQuestions, ...clarifierQuestions, ...validatorQuestions];
  const currentQuestion = allSectionQuestions[currentQuestionIndex];

  const currentResponse = responses.find(r => r.questionId === currentQuestion?.id);
  const isLastQuestion = currentQuestionIndex === allSectionQuestions.length - 1;
  const canGoNext = currentResponse !== undefined;
  const canGoPrevious = currentQuestionIndex > 0;

  // Update current section based on question index
  useEffect(() => {
    if (currentQuestionIndex < broadQuestions.length) {
      setCurrentSection('Broad');
    } else if (currentQuestionIndex < broadQuestions.length + clarifierQuestions.length) {
      setCurrentSection('Clarifier');
    } else {
      setCurrentSection('Validator');
    }
  }, [currentQuestionIndex, broadQuestions.length, clarifierQuestions.length]);

  const handleResponse = (response: Response) => {
    setResponses(prev => {
      const existing = prev.findIndex(r => r.questionId === response.questionId);
      let updatedResponses;
      if (existing >= 0) {
        updatedResponses = [...prev];
        updatedResponses[existing] = response;
      } else {
        updatedResponses = [...prev, response];
      }
      
      // Notify parent of progress update
      if (onProgressUpdate) {
        onProgressUpdate(updatedResponses, currentQuestionIndex);
      }
      
      // Auto-save progress to localStorage when from dashboard
      if (onBackToDashboard) {
        try {
          const progressData = {
            responses: updatedResponses,
            currentQuestionIndex: currentQuestionIndex,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('assessmentProgress', JSON.stringify(progressData));
          console.log('Auto-saved progress:', progressData);
        } catch (error) {
          console.error('Error auto-saving progress:', error);
        }
      }
      
      return updatedResponses;
    });
  };

  const handleNext = () => {
    if (isLastQuestion && canGoNext) {
      handleComplete();
    } else if (canGoNext) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = calculateArchetypeScores(responses, allSectionQuestions);
    
    onComplete(result);
  };

  // Auto-advance for certain question types
  useEffect(() => {
    if (currentResponse && (currentQuestion?.format === 'Forced Choice' || currentQuestion?.format === 'Word Choice')) {
      const timer = setTimeout(() => {
        if (canGoNext) {
          handleNext();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentResponse, currentQuestion?.format]);

  if (!currentQuestion) return null;

  const getSectionProgress = () => {
    const broadCompleted = responses.filter(r => 
      broadQuestions.some(q => q.id === r.questionId)
    ).length;
    
    const clarifierCompleted = responses.filter(r => 
      clarifierQuestions.some(q => q.id === r.questionId)
    ).length;
    
    const validatorCompleted = responses.filter(r => 
      validatorQuestions.some(q => q.id === r.questionId)
    ).length;
    
    return {
      broad: { completed: broadCompleted, total: broadQuestions.length },
      clarifier: { completed: clarifierCompleted, total: clarifierQuestions.length },
      validator: { completed: validatorCompleted, total: validatorQuestions.length }
    };
  };

  const sectionProgress = getSectionProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressBar 
            current={currentQuestionIndex + 1} 
            total={allSectionQuestions.length}
            currentSection={currentSection}
            sectionProgress={sectionProgress}
            className="mb-2"
          />
        </div>

        {/* Question */}
        <div className="mb-8">
          <QuestionCard
            question={currentQuestion}
            response={currentResponse}
            onResponse={handleResponse}
            disabled={isSubmitting}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious || isSubmitting}
            className={`${!canGoPrevious ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {onBackToDashboard && (
            <Button
              variant="secondary"
              onClick={onBackToDashboard}
              disabled={isSubmitting}
              className="absolute left-1/2 transform -translate-x-1/2"
            >
              Save & Return to Dashboard
            </Button>
          )}

          <div className="text-sm text-gray-500">
            {currentQuestionIndex + 1} / {allSectionQuestions.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </div>
            ) : isLastQuestion ? (
              'Complete Assessment'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}