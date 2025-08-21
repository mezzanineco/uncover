import React from 'react';
import { Compass, Shield, Users, Zap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center text-white mb-8">
            <Compass className="w-10 h-10 mr-3" />
            <span className="text-2xl font-bold">Archetype Finder</span>
          </div>
          
          <div className="text-white/90 space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Discover Your Brand's
              <span className="block text-blue-200">True Identity</span>
            </h1>
            <p className="text-xl text-blue-100">
              Comprehensive archetype assessments for teams and organizations
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-6 text-white/80">
          <div className="flex items-center">
            <Shield className="w-6 h-6 mr-3 text-blue-200" />
            <span>Enterprise-grade security</span>
          </div>
          <div className="flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-200" />
            <span>Team collaboration tools</span>
          </div>
          <div className="flex items-center">
            <Zap className="w-6 h-6 mr-3 text-blue-200" />
            <span>Real-time insights</span>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center text-blue-600 mb-4">
              <Compass className="w-8 h-8 mr-2" />
              <span className="text-xl font-bold">Archetype Finder</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
              {subtitle && (
                <p className="text-gray-600">{subtitle}</p>
              )}
            </div>

            {children}
          </div>

          <div className="text-center mt-6 text-sm text-gray-500">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}