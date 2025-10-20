import React, { useState, useEffect } from 'react';
import { Save, Shield, AlertCircle, CheckCircle, History, TestTube } from 'lucide-react';
import { Button } from '../common/Button';
import { passwordRequirementsService } from '../../services/database';
import { validatePassword } from '../../utils/passwordValidation';
import type { PasswordRequirements } from '../../types/auth';

interface PasswordRequirementsManagerProps {
  organisationId: string;
  userId: string;
  userRole: string;
}

export function PasswordRequirementsManager({
  organisationId,
  userId,
  userRole
}: PasswordRequirementsManagerProps) {
  const [requirements, setRequirements] = useState<PasswordRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testPassword, setTestPassword] = useState('');
  const [testResult, setTestResult] = useState<{ isValid: boolean; message: string } | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<{ by: string; at: string } | null>(null);
  const [formData, setFormData] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true
  });

  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    loadRequirements();
    loadAuditLog();
  }, [organisationId]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const data = await passwordRequirementsService.getByOrganisation(organisationId);

      if (data) {
        setRequirements(data);
        setFormData({
          minLength: data.minLength,
          requireUppercase: data.requireUppercase,
          requireLowercase: data.requireLowercase,
          requireNumber: data.requireNumber,
          requireSpecialChar: data.requireSpecialChar
        });

        if (data.updatedAt && data.updatedBy) {
          setLastUpdated({
            by: data.updatedBy,
            at: new Date(data.updatedAt).toLocaleString()
          });
        }
      } else {
        const defaultReqs = await passwordRequirementsService.getDefault();
        setFormData({
          minLength: defaultReqs.minLength,
          requireUppercase: defaultReqs.requireUppercase,
          requireLowercase: defaultReqs.requireLowercase,
          requireNumber: defaultReqs.requireNumber,
          requireSpecialChar: defaultReqs.requireSpecialChar
        });
      }
    } catch (err) {
      console.error('Error loading password requirements:', err);
      setError('Failed to load password requirements');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const log = await passwordRequirementsService.getAuditLog(organisationId);
      setAuditLog(log);
    } catch (err) {
      console.error('Error loading audit log:', err);
    }
  };

  const handleSave = async () => {
    if (!isSuperAdmin) {
      setError('Only super admins can modify password requirements');
      return;
    }

    if (formData.minLength < 6 || formData.minLength > 128) {
      setError('Password length must be between 6 and 128 characters');
      return;
    }

    const atLeastOneEnabled =
      formData.requireUppercase ||
      formData.requireLowercase ||
      formData.requireNumber ||
      formData.requireSpecialChar;

    if (!atLeastOneEnabled) {
      setError('At least one character requirement must be enabled');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (requirements) {
        await passwordRequirementsService.update(organisationId, userId, formData);
      } else {
        await passwordRequirementsService.create(organisationId, userId, formData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadRequirements();
      await loadAuditLog();
    } catch (err: any) {
      console.error('Error saving password requirements:', err);
      setError(err.message || 'Failed to save password requirements');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPassword = () => {
    if (!testPassword) {
      setTestResult({ isValid: false, message: 'Please enter a password to test' });
      return;
    }

    const testReqs: PasswordRequirements = {
      id: 'test',
      organisationId: 'test',
      minLength: formData.minLength,
      requireUppercase: formData.requireUppercase,
      requireLowercase: formData.requireLowercase,
      requireNumber: formData.requireNumber,
      requireSpecialChar: formData.requireSpecialChar,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = validatePassword(testPassword, testReqs);

    if (result.isValid) {
      setTestResult({ isValid: true, message: 'Password meets all requirements' });
    } else {
      const failedReqs = result.requirements
        .filter(req => !req.met)
        .map(req => req.label)
        .join(', ');
      setTestResult({ isValid: false, message: `Failed: ${failedReqs}` });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Super Admin Access Required
            </h3>
            <p className="text-sm text-yellow-700">
              Only super administrators can manage password requirements for the organisation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-gray-600">Loading password requirements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center">
          <Shield className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Password Requirements</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure password complexity requirements for new users and invitation acceptance
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Password Length
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              min="6"
              max="128"
              value={formData.minLength}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                minLength: parseInt(e.target.value) || 6
              }))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            />
            <span className="text-sm text-gray-600">
              characters (minimum: 6, maximum: 128)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Character Requirements</h3>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requireUppercase}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                requireUppercase: e.target.checked
              }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={saving}
            />
            <span className="ml-3 text-sm text-gray-700">
              Require at least one uppercase letter (A-Z)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requireLowercase}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                requireLowercase: e.target.checked
              }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={saving}
            />
            <span className="ml-3 text-sm text-gray-700">
              Require at least one lowercase letter (a-z)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requireNumber}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                requireNumber: e.target.checked
              }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={saving}
            />
            <span className="ml-3 text-sm text-gray-700">
              Require at least one number (0-9)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requireSpecialChar}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                requireSpecialChar: e.target.checked
              }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={saving}
            />
            <span className="ml-3 text-sm text-gray-700">
              Require at least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
            </span>
          </label>
        </div>

        {error && (
          <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Password requirements updated successfully
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <TestTube className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Test Password</h4>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Enter a password to test..."
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={saving}
                  />
                  <button
                    onClick={handleTestPassword}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Test
                  </button>
                </div>
                {testResult && (
                  <div className={`mt-2 text-sm ${
                    testResult.isValid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {lastUpdated && (
            <div className="text-xs text-gray-500">
              Last updated: {lastUpdated.at}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">
                Changes will apply to all new signups and invitation acceptances
              </p>
              {auditLog.length > 0 && (
                <button
                  onClick={() => setShowAuditLog(!showAuditLog)}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center"
                >
                  <History className="w-3 h-3 mr-1" />
                  {showAuditLog ? 'Hide' : 'View'} Change History ({auditLog.length})
                </button>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {showAuditLog && auditLog.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Change History</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">
                          {new Date(entry.changed_at).toLocaleString()}
                        </p>
                        {entry.old_values && (
                          <div className="mt-1 text-xs space-y-1">
                            {Object.entries(entry.new_values).map(([key, newVal]) => {
                              const oldVal = entry.old_values?.[key];
                              if (oldVal !== newVal) {
                                return (
                                  <div key={key} className="text-gray-700">
                                    <span className="font-medium">{key}:</span>{' '}
                                    <span className="text-red-600 line-through">{String(oldVal)}</span>
                                    {' → '}
                                    <span className="text-green-600">{String(newVal)}</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
