import React from 'react';
import { Compass } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Compass className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Archetype Finder</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              How it Works
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Archetypes
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              For Teams
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}