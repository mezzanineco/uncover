import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthLayout } from './components/auth/AuthLayout';
import { SignupForm } from './components/auth/SignupForm';
import { LoginForm } from './components/auth/LoginForm';
import { MagicLinkVerification } from './components/auth/MagicLinkVerification';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { LandingPage } from './components/layout/LandingPage';
import { AssessmentFlow } from './components/assessment/AssessmentFlow';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ASSESSMENT_CONFIG } from './data/questions';
import type { AssessmentResult } from './types';

type AppState = 'landing' | 'auth' | 'assessment' | 'results';
type AuthMode = 'signup' | 'login' | 'verify';

function AppContent() {
  const { user, organisation, member, isLoading, isAuthenticated, login, signup, logout, verifyMagicLink } = useAuth();
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [verificationToken, setVerificationToken] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isFromDashboard, setIsFromDashboard] = useState(false);

  // Handler functions - declared early to avoid hoisting issues
  const handleStartAssessment = () => {
    if (!isAuthenticated) {
      setCurrentState('auth');
      return;
    }
    setCurrentState('assessment');
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setAssessmentResult(result);
    setCurrentState('results');
  };

  const handleRestart = () => {
    setAssessmentResult(null);
    setCurrentState('landing');
  };

  const handleSignup = async (email: string) => {
    await signup(email);
  };

  const handleLogin = async (email: string) => {
    await login(email);
  };

  const handleLoginWithPassword = async (username: string, password: string) => {
    await login(username, password);
  };

  const handleSignupWithPassword = async (username: string, email: string, password: string) => {
    await signup(username, email, password);
  };

  const handleVerificationComplete = (userData: any) => {
    // The AuthProvider will handle the state update
    setCurrentState('landing');
  };

  const handleVerificationFailed = (error: string) => {
    console.error('Verification failed:', error);
    setAuthMode('login');
  };

  // Handle URL-based magic link verification
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setVerificationToken(token);
      setAuthMode('verify');
      setCurrentState('auth');
    }

    // Listen for solo assessment trigger from dashboard
    const handleSoloAssessment = (event: CustomEvent) => {
      const fromDashboard = event.detail?.fromDashboard || false;
      setIsFromDashboard(fromDashboard);
      setCurrentState('assessment');
    };

    window.addEventListener('startSoloAssessment', handleSoloAssessment as EventListener);
    return () => window.removeEventListener('startSoloAssessment', handleSoloAssessment as EventListener);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && organisation && member) {
    if (currentState === 'assessment') {
      return (
        <AssessmentFlow
          questions={ASSESSMENT_CONFIG.questions}
          title={ASSESSMENT_CONFIG.title}
          description={ASSESSMENT_CONFIG.description}
          onComplete={handleAssessmentComplete}
          onBackToDashboard={isFromDashboard ? handleBackToDashboard : undefined}
          onBackToDashboard={isFromDashboard ? handleBackToDashboard : undefined}
        />
      );
    }

    if (currentState === 'results' && assessmentResult) {
      return (
        <ResultsDashboard
          result={assessmentResult}
          onRestart={handleRestart}
        />
      );
    }

    return (
      <UserDashboard
        user={user}
        organisation={organisation}
        member={member}
        onLogout={logout}
        onStartAssessment={handleStartAssessment}
      />
    );
  }

  // Direct admin access for testing (no login required)
  if (currentState === 'admin') {
    return <AdminDashboard />;
  }

  if (currentState === 'auth') {
    return (
      <AuthLayout
        title={authMode === 'signup' ? 'Create your account' : authMode === 'login' ? 'Welcome back' : 'Verifying...'}
        subtitle={authMode === 'signup' ? 'Start discovering your brand archetype' : authMode === 'login' ? 'Sign in to your account' : undefined}
      >
        {authMode === 'signup' && (
          <SignupForm
            onSignup={handleSignup}
            onSignupWithPassword={handleSignupWithPassword}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
        {authMode === 'login' && (
          <LoginForm
            onLogin={handleLogin}
            onLoginWithPassword={handleLoginWithPassword}
            onSwitchToSignup={() => setAuthMode('signup')}
          />
        )}
        {authMode === 'verify' && (
          <MagicLinkVerification
            token={verificationToken}
            onVerificationComplete={handleVerificationComplete}
            onVerificationFailed={handleVerificationFailed}
          />
        )}
      </AuthLayout>
    );
  }

  if (currentState === 'assessment') {
    return (
      <AssessmentFlow
        questions={ASSESSMENT_CONFIG.questions}
        title={ASSESSMENT_CONFIG.title}
        description={ASSESSMENT_CONFIG.description}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  if (currentState === 'results' && assessmentResult) {
    return (
      <ResultsDashboard
        result={assessmentResult}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <LandingPage 
      onStartAssessment={handleStartAssessment}
      onAdminAccess={() => setCurrentState('admin')}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;