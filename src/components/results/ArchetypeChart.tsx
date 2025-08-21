import React from 'react';
import type { ArchetypeScore } from '../../types';

interface ArchetypeChartProps {
  archetypes: ArchetypeScore[];
  className?: string;
}

export function ArchetypeChart({ archetypes, className = '' }: ArchetypeChartProps) {
  // Show all 12 archetypes
  const allArchetypes = archetypes;

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Complete Archetype Profile</h3>
      
      <div className="space-y-4">
        {allArchetypes.map((archetype, index) => (
          <div key={archetype.name} className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{archetype.name}</span>
              <span className="text-sm font-semibold text-gray-700">
                {archetype.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${archetype.percentage}%`,
                  backgroundColor: archetype.color,
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
            
            <p className="text-xs text-gray-600 mt-1">{archetype.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}