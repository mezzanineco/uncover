import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './components/auth/AuthProvider';
import { useAuth } from './contexts/AuthContext';
import { AuthLayout } from './components/auth/AuthLayout';
import { SignupForm } from './components/auth/SignupForm';
import { LoginForm } from './components/auth/LoginForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
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
type AuthMode = 'signup' | 'login' | 'verify' | 'forgot-password' | 'reset-password';

function AppContent() {
  const { user, organisation, member, isLoading, isAuthenticated, isAwaitingEmailVerification, login, signup, logout, verifyMagicLink, sendPasswordResetEmail, resetPassword } = useAuth();
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

  // Check for invite token or email confirmation in URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Handle invite links
    const inviteMatch = path.match(/^\/invite\/([a-f0-9-]+)$/i);
    if (inviteMatch) {
      setInviteToken(inviteMatch[1]);
      setCurrentState('invite');
      return;
    }

    // Handle password reset callback
    // Supabase sends the token in the URL hash/fragment after redirect
    if (path === '/reset-password') {
      console.log('Password reset callback detected');
      console.log('URL params:', params.toString());
      console.log('URL hash:', window.location.hash);

      // Check both query params and hash for the type parameter
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = params.get('type') || hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      console.log('Type:', type);
      console.log('Has access token:', !!accessToken);
      console.log('Has refresh token:', !!refreshToken);

      if (type === 'recovery' && accessToken) {
        console.log('Valid password reset link detected with token');

        // Verify the session with Supabase
        (async () => {
          try {
            const { supabase } = await import('./lib/supabase');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });

            if (error) {
              console.error('Error setting session:', error);
              alert('Invalid or expired reset link. Please request a new one.');
              setCurrentState('landing');
            } else {
              console.log('Session verified, showing reset form');
              setAuthMode('reset-password');
              setCurrentState('auth');
              // Clean up the URL
              window.history.replaceState({}, '', '/reset-password');
            }
          } catch (err) {
            console.error('Error verifying reset token:', err);
            alert('Failed to verify reset link. Please try again.');
            setCurrentState('landing');
          }
        })();
      } else {
        console.error('Invalid password reset link - missing type or token');
        alert('Invalid password reset link. Please request a new one.');
        setCurrentState('landing');
      }
      return;
    }

    // Handle email confirmation callback
    if (path === '/auth/confirm') {
      console.log('========================================');
      console.log('EMAIL CONFIRMATION CALLBACK DETECTED');
      console.log('========================================');
      console.log('URL path:', path);
      console.log('URL params:', params.toString());

      // Check for error in URL params
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      const type = params.get('type');
      const tokenHash = params.get('token_hash');

      console.log('Confirmation params:', { error, errorDescription, type, hasTokenHash: !!tokenHash });

      if (error) {
        console.error('❌ Email confirmation error:', error, errorDescription);

        // Determine user-friendly error message
        let userMessage = 'Email confirmation failed. ';
        if (error === 'access_denied') {
          userMessage += 'The confirmation link may have expired or is invalid.';
        } else {
          userMessage += errorDescription || error;
        }
        userMessage += ' Please try signing up again or contact support.';

        alert(userMessage);
        window.history.replaceState({}, document.title, '/');
        setCurrentState('auth');
        setAuthMode('signup');
        return;
      }

      // The auth state change listener in AuthProvider will handle the session
      // Supabase automatically creates the session when the user clicks the confirmation link
      console.log('✅ Email confirmation successful! Supabase is creating session...');
      console.log('AuthProvider will detect the session and load user data');

      // Clear verification flags
      sessionStorage.removeItem('awaiting_email_verification');
      sessionStorage.removeItem('verification_email');

      // Clear the URL parameters after a brief delay to allow auth state to update
      setTimeout(() => {
        console.log('Cleaning up URL parameters');
        window.history.replaceState({}, document.title, '/');
      }, 500);
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

  if (isLoading && !isAwaitingEmailVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-800 font-medium mb-2">Loading your workspace...</p>
          <p className="text-gray-500 text-sm">
            This should only take a moment. If this persists, try refreshing the page.
          </p>
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
    const getAuthTitle = () => {
      switch (authMode) {
        case 'signup': return 'Create your account';
        case 'login': return 'Welcome back';
        case 'forgot-password': return 'Reset your password';
        case 'reset-password': return 'Set new password';
        case 'verify': return 'Verifying...';
        default: return 'Welcome';
      }
    };

    const getAuthSubtitle = () => {
      switch (authMode) {
        case 'signup': return 'Start discovering your brand archetype';
        case 'login': return 'Sign in to your account';
        default: return undefined;
      }
    };

    return (
      <AuthLayout
        title={getAuthTitle()}
        subtitle={getAuthSubtitle()}
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
            onForgotPassword={() => setAuthMode('forgot-password')}
          />
        )}
        {authMode === 'forgot-password' && (
          <ForgotPasswordForm
            onSendResetLink={sendPasswordResetEmail}
            onBackToLogin={() => setAuthMode('login')}
          />
        )}
        {authMode === 'reset-password' && (
          <ResetPasswordForm
            onResetPassword={resetPassword}
            onBackToLogin={() => setAuthMode('login')}
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
      onSignIn={() => {
        setAuthMode('login');
        setCurrentState('auth');
      }}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;