import React, { useState, useEffect } from 'react';
import { Save, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { passwordRequirementsService } from '../../services/database';
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

  const handleSave = async () => {
    if (!isSuperAdmin) {
      setError('Only super admins can modify password requirements');
      return;
    }

    if (formData.minLength < 6 || formData.minLength > 128) {
      setError('Password length must be between 6 and 128 characters');
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
    } catch (err: any) {
      console.error('Error saving password requirements:', err);
      setError(err.message || 'Failed to save password requirements');
    } finally {
      setSaving(false);
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

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Changes will apply to all new signups and invitation acceptances
          </p>
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
      </div>
    </div>
  );
}
