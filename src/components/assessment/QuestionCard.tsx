import React from 'react';
import type { ParsedQuestion, Response } from '../../types';
import { LikertScale } from '../questions/LikertScale';
import { ForcedChoice } from '../questions/ForcedChoice';
import { ScenarioQuestion } from '../questions/ScenarioQuestion';
import { SliderQuestion } from '../questions/SliderQuestion';
import { ImageChoice } from '../questions/ImageChoice';
import { WordChoice } from '../questions/WordChoice';
import { WordChoiceMulti } from '../questions/WordChoiceMulti';
import { RankingQuestion } from '../questions/RankingQuestion';
import { StoryCompletion } from '../questions/StoryCompletion';

interface QuestionCardProps {
  question: ParsedQuestion;
  response: Response | undefined;
  onResponse: (response: Response) => void;
  disabled?: boolean;
}

export function QuestionCard({ question, response, onResponse, disabled }: QuestionCardProps) {
  const handleResponse = (value: number | string | string[]) => {
    onResponse({
      questionId: question.id,
      value,
      timestamp: new Date()
    });
  };

  const renderQuestion = () => {
    switch (question.format) {
      case 'Slider':
        return (
          <SliderQuestion
            question={question.question}
            value={(response?.value as number) || 3}
            onChange={handleResponse}
            disabled={disabled}
          />
        );
      
      case 'Forced Choice':
        return (
          <ForcedChoice
            question={question.question}
            options={question.parsedOptions}
            value={(response?.value as string) || ''}
            onChange={handleResponse}
            disabled={disabled}
          />
        );
      
      case 'Scenario Decision':
        return (
          <ForcedChoice
            question={question.question}
            options={question.parsedOptions}
            value={(response?.value as string) || ''}
            onChange={handleResponse}
            disabled={disabled}
          />
        );

      case 'Image Choice':
        return (
          <ImageChoice
            question={question.question}
            options={question.parsedOptions}
            assetKeys={question.assetKeys}
            value={(response?.value as string) || ''}
            onChange={handleResponse}
            disabled={disabled}
          />
        );

      case 'Word Choice':
        return (
          <WordChoice
            question={question.question}
            options={question.parsedOptions}
            value={(response?.value as string) || ''}
            onChange={handleResponse}
            disabled={disabled}
          />
        );

      case 'Word Choice (Multi)':
        return (
          <WordChoiceMulti
            question={question.question}
            options={question.parsedOptions}
            value={(response?.value as string[]) || []}
            onChange={handleResponse}
            disabled={disabled}
            maxSelections={2}
          />
        );

      case 'Ranking':
        return (
          <RankingQuestion
            question={question.question}
            options={question.parsedOptions}
            value={(response?.value as string[]) || []}
            onChange={handleResponse}
            disabled={disabled}
          />
        );

      case 'Story Completion':
        return (
          <StoryCompletion
            question={question.question}
            options={question.parsedOptions}
            value={(response?.value as string) || ''}
            onChange={handleResponse}
            disabled={disabled}
          />
        );
      
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold mb-2">Unsupported Question Format</h3>
              <p className="text-red-600 mb-2">Format: "{question.format}"</p>
              <p className="text-red-600 text-sm">Question ID: {question.id}</p>
              <details className="mt-2">
                <summary className="text-red-700 cursor-pointer">Debug Info</summary>
                <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto">
                  {JSON.stringify(question, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto animate-fadeIn">
      {renderQuestion()}
    </div>
  );
}