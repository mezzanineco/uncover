import React from 'react';
import { Button } from '../common/Button';
import { Play, Users, BarChart3, FileText, LogIn } from 'lucide-react';

interface LandingPageProps {
  onStartAssessment: () => void;
  onAdminAccess?: () => void;
  onSignIn?: () => void;
}

export function LandingPage({ onStartAssessment, onAdminAccess, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header with Sign In */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            Brand Archetype
          </div>
          {onSignIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignIn}
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Discover Your Brand's
            <span className="text-blue-600 block">Unique Archetype</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Uncover the personality that drives your brand through our comprehensive assessment. 
            Get actionable insights, detailed reports, and strategic recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={onStartAssessment}
              className="px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Play className="w-6 h-6 mr-3" />
              Start Assessment
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Watch Demo
            </Button>
            
            {onAdminAccess && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onAdminAccess}
                className="text-xs"
              >
                Admin Access
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            ⏱️ Takes approximately 15 minutes • No registration required
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Use Archetype Finder?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform combines research-backed methodology with modern technology 
            to deliver insights that transform how you think about your brand.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Assessment</h3>
            <p className="text-gray-600">
              Engaging questions with multiple formats including scenarios, scales, and visual elements.
            </p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4 group-hover:bg-amber-200 transition-colors">
              <BarChart3 className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Scoring</h3>
            <p className="text-gray-600">
              Sophisticated algorithms calculate your unique archetype blend with confidence scoring.
            </p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 group-hover:bg-green-200 transition-colors">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Perfect for workshops, team sessions, and collaborative brand development.
            </p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 group-hover:bg-purple-200 transition-colors">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Reports</h3>
            <p className="text-gray-600">
              Comprehensive PDF reports with insights, recommendations, and strategic guidance.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Discover Your Brand Archetype?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of brands who've transformed their identity with data-driven insights.
          </p>
          <Button 
            size="lg" 
            onClick={onStartAssessment}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg shadow-lg"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}