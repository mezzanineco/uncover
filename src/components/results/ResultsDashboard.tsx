import React from 'react';
import type { AssessmentResult } from '../../types';
import { ArchetypeChart } from './ArchetypeChart';
import { Button } from '../common/Button';
import { Download, Share2, RotateCcw, Award } from 'lucide-react';

interface ResultsDashboardProps {
  result: AssessmentResult;
  onRestart: () => void;
}

export function ResultsDashboard({ result, onRestart }: ResultsDashboardProps) {
  const topArchetype = result.primaryArchetype;
  const secondaryArchetype = result.secondaryArchetype;

  const handleExport = () => {
    // TODO: Implement PDF export
    console.log('Exporting results...');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Brand Archetype Results',
          text: `I discovered my primary brand archetype is ${topArchetype.name} (${topArchetype.percentage}%)`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `My primary brand archetype is ${topArchetype.name} (${topArchetype.percentage}%)`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Brand Archetype Results</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Based on your responses, we've identified your unique brand archetype mix
          </p>
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Key Insights</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Archetype</h3>
              <div className="p-4 rounded-lg" style={{ backgroundColor: topArchetype.color }}>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {topArchetype.name} ({topArchetype.percentage}%)
                </h4>
                <p className="text-gray-700 mb-3">{topArchetype.description}</p>
                <div className="flex flex-wrap gap-2">
                  {topArchetype.traits.map(trait => (
                    <span key={trait} className="px-2 py-1 bg-white/60 rounded text-sm text-gray-800">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Secondary Archetype</h3>
              <div className="p-4 rounded-lg" style={{ backgroundColor: secondaryArchetype.color }}>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {secondaryArchetype.name} ({secondaryArchetype.percentage}%)
                </h4>
                <p className="text-gray-700 mb-3">{secondaryArchetype.description}</p>
                <div className="flex flex-wrap gap-2">
                  {secondaryArchetype.traits.slice(0, 3).map(trait => (
                    <span key={trait} className="px-2 py-1 bg-white/60 rounded text-sm text-gray-800">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Confidence Score</h4>
                <p className="text-sm text-gray-600">Based on response consistency and completion</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">{result.confidence}%</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <ArchetypeChart archetypes={result.allScores} className="mb-8" />

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={handleExport} variant="primary" size="lg">
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </Button>
          
          <Button onClick={handleShare} variant="outline" size="lg">
            <Share2 className="w-5 h-5 mr-2" />
            Share Results
          </Button>
          
          <Button onClick={onRestart} variant="secondary" size="lg">
            <RotateCcw className="w-5 h-5 mr-2" />
            Take Again
          </Button>
        </div>

        {/* Methodology Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 max-w-3xl mx-auto">
            Results are based on validated archetype research and weighted scoring algorithms. 
            Your complete archetype profile shows how all 12 archetypes contribute to your unique brand personality and can guide strategic decision-making.
          </p>
        </div>
      </div>
    </div>
  );
}