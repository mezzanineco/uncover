import React, { useState, useMemo, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle, AlertCircle, User, Lock, Eye, EyeOff, Check, X, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { passwordRequirementsService } from '../../services/database';
import { validatePassword, getDefaultPasswordRequirements } from '../../utils/passwordValidation';
import type { PasswordRequirements } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';

interface SignupFormProps {
  onSignup: (email: string) => Promise<void>;
  onSignupWithPassword: (username: string, email: string, password: string) => Promise<void>;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSignup, onSignupWithPassword, onSwitchToLogin }: SignupFormProps) {
  const auth = useAuth();
  const [signupMethod, setSignupMethod] = useState<'magic-link' | 'password'>('password');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'magic-link' | 'email-verification'>('magic-link');
  const [error, setError] = useState('');
  const [pwdRequirements, setPwdRequirements] = useState<PasswordRequirements>(getDefaultPasswordRequirements());
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const loadRequirements = async () => {
      try {
        const reqs = await passwordRequirementsService.getDefault();
        setPwdRequirements(reqs);
      } catch (err) {
        console.error('Error loading password requirements:', err);
      }
    };
    loadRequirements();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!auth.resendConfirmationEmail || resendCooldown > 0) return;

    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      await auth.resendConfirmationEmail(email);
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const passwordValidation = useMemo(() => {
    const validation = validatePassword(password, pwdRequirements);
    return {
      requirements: validation.requirements,
      allMet: validation.isValid,
      passwordsMatch: password === confirmPassword && confirmPassword.length > 0
    };
  }, [password, confirmPassword, pwdRequirements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (signupMethod === 'password') {
      if (!username.trim()) {
        setError('Username is required');
        return;
      }

      if (!password.trim()) {
        setError('Password is required');
        return;
      }

      if (!passwordValidation.allMet) {
        setError('Please meet all password requirements');
        return;
      }

      if (!passwordValidation.passwordsMatch) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      if (signupMethod === 'magic-link') {
        await onSignup(email);
        setSuccessType('magic-link');
        setIsSuccess(true);
      } else {
        await onSignupWithPassword(username, email, password);
        // If we reach here without error, signup succeeded without email confirmation
        // User will be automatically logged in via AuthProvider
      }
    } catch (err: any) {
      // Check if this is the email confirmation required signal
      if (err.message === 'EMAIL_CONFIRMATION_REQUIRED') {
        setSuccessType('email-verification');
        setIsSuccess(true);
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && successType === 'magic-link') {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Check your email
          </h3>
          <p className="text-gray-600 mb-4">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Click the link in your email to complete your signup. The link expires in 15 minutes.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Didn't receive the email?{' '}
            <button
              onClick={() => setSignupMethod('password')}
              className="text-blue-600 hover:underline font-medium"
            >
              Try password signup
            </button>
            {' or '}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-blue-600 hover:underline font-medium"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess && successType === 'email-verification') {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-green-600" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Account Created Successfully!
          </h3>
          <p className="text-gray-600 mb-4">
            We've sent a confirmation email to <strong className="text-gray-900">{email}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Email Verification Required</p>
              <p className="text-sm text-blue-700 mt-1">
                Before you can begin your first assessment, you'll need to verify your email address.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left space-y-3">
          <p className="text-sm font-semibold text-gray-900">Next Steps:</p>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="font-semibold text-blue-600 flex-shrink-0">1.</span>
              <span>Check your inbox for an email from us</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-semibold text-blue-600 flex-shrink-0">2.</span>
              <span>Click the confirmation link in the email</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-semibold text-blue-600 flex-shrink-0">3.</span>
              <span>You'll be automatically redirected to the platform</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-semibold text-blue-600 flex-shrink-0">4.</span>
              <span>Start creating your first assessment!</span>
            </li>
          </ol>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Email should arrive within 5 minutes</span>
        </div>

        {resendSuccess && (
          <div className="flex items-center justify-center space-x-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle className="w-4 h-4" />
            <span>Confirmation email sent successfully!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium text-gray-900">Didn't receive the email?</p>
            <ul className="space-y-1 text-left ml-4">
              <li className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>Check your spam or junk folder</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>Make sure {email} is correct</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>Wait a few minutes and check again</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleResendEmail}
            disabled={resendLoading || resendCooldown > 0}
            variant="outline"
            className="w-full"
          >
            {resendLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </div>
            ) : resendCooldown > 0 ? (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Resend in {resendCooldown}s
              </div>
            ) : (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Confirmation Email
              </div>
            )}
          </Button>

          <div className="text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Signup Method Toggle */}
      <div className="flex rounded-lg border border-gray-300 p-1">
        <button
          type="button"
          onClick={() => setSignupMethod('password')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            signupMethod === 'password'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setSignupMethod('magic-link')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            signupMethod === 'magic-link'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {signupMethod === 'password' && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Choose a username"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {signupMethod === 'magic-link' ? 'Work Email' : 'Email Address'}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="you@company.com"
              disabled={isLoading}
            />
          </div>
        </div>

        {signupMethod === 'password' && (
          <>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Create a password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {passwordValidation.requirements.map((req, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                      req.met ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {req.met ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={`text-sm ${req.met ? 'text-gray-900' : 'text-gray-600'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center text-xs">
                  {passwordValidation.passwordsMatch ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 mr-1.5" />
                      <span className="text-green-700">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-600 mr-1.5" />
                      <span className="text-red-700">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="mt-2 flex items-center text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={
            isLoading ||
            (signupMethod === 'password' &&
              (!passwordValidation.allMet || !passwordValidation.passwordsMatch))
          }
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {signupMethod === 'magic-link' ? 'Sending magic link...' : 'Creating account...'}
            </div>
          ) : (
            <>
              {signupMethod === 'magic-link' ? 'Get started free' : 'Create Account'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>

      {signupMethod === 'password' && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Prefer magic link?{' '}
            <button
              type="button"
              onClick={() => setSignupMethod('magic-link')}
              className="text-blue-600 hover:underline font-medium"
            >
              Use magic link instead
            </button>
          </p>
        </div>
      )}
    </div>
  );
}