import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '../common/Button';

interface MagicLinkVerificationProps {
  token: string;
  onVerificationComplete: (user: any) => void;
  onVerificationFailed: (error: string) => void;
}

export function MagicLinkVerification({ 
  token, 
  onVerificationComplete, 
  onVerificationFailed 
}: MagicLinkVerificationProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      // Simulate API call to verify magic link token
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock verification logic
      if (token === 'expired') {
        setStatus('expired');
        setError('This magic link has expired. Please request a new one.');
        return;
      }
      
      if (token === 'invalid') {
        setStatus('error');
        setError('This magic link is invalid or has already been used.');
        return;
      }

      // Success case
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John Doe',
        organisation: {
          id: 'org-1',
          name: 'Acme Corp',
          role: 'user_admin'
        }
      };

      setStatus('success');
      setTimeout(() => {
        onVerificationComplete(mockUser);
      }, 1500);

    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Verification failed. Please try again.');
      onVerificationFailed(error);
    }
  };

  const handleRetry = () => {
    setStatus('verifying');
    setError('');
    verifyToken();
  };

  return (
    <div className="text-center space-y-6">
      {status === 'verifying' && (
        <>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verifying your magic link...
            </h3>
            <p className="text-gray-600">
              Please wait while we confirm your identity.
            </p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome back!
            </h3>
            <p className="text-gray-600">
              You're being redirected to your dashboard...
            </p>
          </div>
        </>
      )}

      {(status === 'error' || status === 'expired') && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {status === 'expired' ? 'Link expired' : 'Verification failed'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <Button onClick={handleRetry} variant="outline">
              Try again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}