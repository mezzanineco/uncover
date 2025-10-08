import React, { useState, useEffect } from 'react';
import { AuthProvider } from './components/auth/AuthProvider';
import { useAuth } from './contexts/AuthContext';
import { AuthLayout } from './components/auth/AuthLayout';
import { SignupForm } from './components/auth/SignupForm';
import { LoginForm } from './components/auth/LoginForm';
import { MagicLinkVerification } from './components/auth/MagicLinkVerification';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { LandingPage } from './components/layout/LandingPage';
import { AssessmentFlow } from './components/assessment/AssessmentFlow';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InviteAcceptance } from './components/invite/InviteAcceptance';
import { ASSESSMENT_CONFIG } from './data/questions';
import type { AssessmentResult } from './types';

type AppState = 'landing' | 'auth' | 'assessment' | 'results' | 'invite';
type AuthMode = 'signup' | 'login' | 'verify';

function AppContent() {
  const { user, organisation, member, isLoading, isAuthenticated, login, signup, logout, verifyMagicLink } = useAuth();
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [verificationToken, setVerificationToken] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isFromDashboard, setIsFromDashboard] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string>('');

  // Handler functions - declared early to avoid hoisting issues
  const handleStartAssessment = () => {
    if (!isAuthenticated) {
      setCurrentState('auth');
      return;
    }
    setCurrentState('assessment');
  };

  const handleAssessmentComplete = async (result: AssessmentResult) => {
    console.log('Assessment completed, saving result...');

    // Clear the saved progress since assessment is complete
    if (currentAssessmentId) {
      localStorage.removeItem(`assessmentProgress_${currentAssessmentId}`);

      // Update assessment status in database
      if (user && organisation) {
        try {
          const { assessmentService } = await import('./services/database');
          await assessmentService.updateAssessment(currentAssessmentId, {
            status: 'completed',
            stats: {
              totalInvited: 1,
              totalStarted: 1,
              totalCompleted: 1,
              averageCompletionTime: 15
            }
          });

          // Dispatch event to update dashboard
          window.dispatchEvent(new CustomEvent('assessmentCompleted'));
        } catch (error) {
          console.error('Error updating assessment in database:', error);
        }
      }
    }

    setAssessmentResult(result);
    setCurrentState('results');
    setCurrentAssessmentId(null);
  };

  const handleBackToDashboardFromResults = () => {
    setCurrentState('landing');
    setAssessmentResult(null);
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

  const handleBackToDashboard = async () => {
    // Save current progress before returning to dashboard
    console.log('Saving progress and returning to dashboard...');

    if (currentState === 'assessment' && responses.length > 0 && currentAssessmentId) {
      // Update assessment status in database
      if (user && organisation) {
        try {
          const { assessmentService } = await import('./services/database');
          await assessmentService.updateAssessment(currentAssessmentId, {
            status: 'in_progress',
            stats: {
              totalInvited: 1,
              totalStarted: 1,
              totalCompleted: 0,
              averageCompletionTime: undefined
            }
          });

          // Save progress to localStorage for client-side state
          const assessmentProgress = {
            responses: responses,
            currentQuestionIndex: currentQuestionIndex
          };
          localStorage.setItem(`assessmentProgress_${currentAssessmentId}`, JSON.stringify(assessmentProgress));

          // Trigger event to update dashboard
          window.dispatchEvent(new CustomEvent('assessmentSaved'));
        } catch (error) {
          console.error('Error saving progress to database:', error);
        }
      }
    }

    setCurrentState('landing');
    setIsFromDashboard(false);
    setResponses([]);
    setCurrentQuestionIndex(0);
    setCurrentAssessmentId(null);
  };

  // Check for invite token in URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const inviteMatch = path.match(/^\/invite\/([a-f0-9-]+)$/i);
    if (inviteMatch) {
      setInviteToken(inviteMatch[1]);
      setCurrentState('invite');
    }
  }, []);

  // Event listeners for dashboard interactions
  useEffect(() => {
    const handleStartSoloAssessment = (event: CustomEvent) => {
      console.log('Starting solo assessment from dashboard');
      setIsFromDashboard(event.detail?.fromDashboard || false);
      setResponses([]);
      setCurrentQuestionIndex(0);
      setCurrentAssessmentId(null);
      setCurrentState('assessment');
    };

    const handleStartSoloAssessmentWithId = (event: CustomEvent) => {
      const { assessmentId, fromDashboard } = event.detail;
      console.log('Starting solo assessment with ID:', assessmentId);
      setIsFromDashboard(fromDashboard || false);
      setResponses([]);
      setCurrentQuestionIndex(0);
      setCurrentAssessmentId(assessmentId);
      setCurrentState('assessment');
    };

    const handleContinueAssessment = (event: CustomEvent) => {
      const { assessmentId } = event.detail;
      console.log('Continuing assessment:', assessmentId);
      
      try {
        // Try to load progress for this specific assessment
        const savedProgress = localStorage.getItem(`assessmentProgress_${assessmentId}`);
        if (savedProgress) {
          const { responses: savedResponses, currentQuestionIndex: savedIndex } = JSON.parse(savedProgress);
          console.log('Loaded saved progress:', { 
            responsesCount: savedResponses?.length || 0, 
            questionIndex: savedIndex 
          });
          
          setResponses(savedResponses || []);
          setCurrentQuestionIndex(savedIndex || 0);
          setIsFromDashboard(true);
          setCurrentAssessmentId(assessmentId);
          setCurrentState('assessment');
        } else {
          console.log('No saved progress found for assessment, starting fresh');
          setResponses([]);
          setCurrentQuestionIndex(0);
          setIsFromDashboard(true);
          setCurrentAssessmentId(assessmentId);
          setCurrentState('assessment');
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
        // Fallback to fresh start on error
        setResponses([]);
        setCurrentQuestionIndex(0);
        setIsFromDashboard(true);
        setCurrentAssessmentId(assessmentId);
        setCurrentState('assessment');
      }
    };
    
    // Register event listeners
    window.addEventListener('startSoloAssessment', handleStartSoloAssessment as EventListener);
    window.addEventListener('startSoloAssessmentWithId', handleStartSoloAssessmentWithId as EventListener);
    window.addEventListener('continueAssessment', handleContinueAssessment as EventListener);

    return () => {
      window.removeEventListener('startSoloAssessment', handleStartSoloAssessment as EventListener);
      window.removeEventListener('startSoloAssessmentWithId', handleStartSoloAssessmentWithId as EventListener);
      window.removeEventListener('continueAssessment', handleContinueAssessment as EventListener);
    };
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
          initialResponses={responses}
          initialQuestionIndex={currentQuestionIndex}
          onProgressUpdate={(newResponses, newIndex) => {
            setResponses(newResponses);
            setCurrentQuestionIndex(newIndex);
          }}
          currentAssessmentId={currentAssessmentId}
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

  // Invite acceptance page
  if (currentState === 'invite' && inviteToken) {
    return (
      <InviteAcceptance
        token={inviteToken}
        onSuccess={() => {
          window.location.href = '/dashboard';
        }}
      />
    );
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
        currentAssessmentId={currentAssessmentId}
      />
    );
  }

  if (currentState === 'results' && assessmentResult) {
    return (
      <ResultsDashboard
        result={assessmentResult}
        onRestart={handleRestart}
        onBackToDashboard={isAuthenticated ? handleBackToDashboardFromResults : undefined}
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