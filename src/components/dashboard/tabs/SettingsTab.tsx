import React, { useState } from 'react';
import {
  User,
  Building,
  CreditCard,
  Save,
  Upload,
  ExternalLink,
  Shield,
  Bell,
  Globe,
  Download,
  Key
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { User as UserType, Organisation, OrganisationMember } from '../../../types/auth';
import { hasPermission } from '../../../types/auth';
import { PasswordRequirementsManager } from '../../admin/PasswordRequirementsManager';

interface SettingsTabProps {
  user: UserType;
  organisation: Organisation;
  member: OrganisationMember;
}

export function SettingsTab({ user, organisation, member }: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'organisation' | 'billing' | 'security' | 'password'>('profile');
  
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    email: user.email,
    avatar: user.avatar || ''
  });

  const [orgForm, setOrgForm] = useState({
    name: organisation.name,
    industry: organisation.industry || '',
    size: organisation.size || 'small',
    logo: organisation.logo || ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // Show success message
  };

  const handleSaveOrganisation = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // Show success message
  };

  const canManageOrganisation = hasPermission(member.role, 'MANAGE_ORGANISATION');

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organisation', label: 'Organisation', icon: Building, permission: 'VIEW_ORGANISATION' as const },
    { id: 'billing', label: 'Billing', icon: CreditCard, permission: 'MANAGE_ORGANISATION' as const },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'password', label: 'Password Policy', icon: Key, permission: 'MANAGE_ORGANISATION' as const },
  ];

  const visibleSections = sections.filter(section => 
    !section.permission || hasPermission(member.role, section.permission)
  );

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {profileForm.avatar ? (
                <img src={profileForm.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span className="text-xl font-medium text-blue-600">
                  {profileForm.name?.charAt(0) || profileForm.email.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Change Photo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Email changes require verification
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Button onClick={handleSaveProfile} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  const renderOrganisationSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organisation Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              {orgForm.logo ? (
                <img src={orgForm.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <Building className="w-8 h-8 text-gray-400" />
              )}
            </div>
            {canManageOrganisation && (
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organisation Name
              </label>
              <input
                type="text"
                value={orgForm.name}
                onChange={(e) => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!canManageOrganisation}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                value={orgForm.industry}
                onChange={(e) => setOrgForm(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!canManageOrganisation}
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <select
                value={orgForm.size}
                onChange={(e) => setOrgForm(prev => ({ ...prev, size: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!canManageOrganisation}
              >
                <option value="startup">Startup (1-10)</option>
                <option value="small">Small (11-50)</option>
                <option value="medium">Medium (51-200)</option>
                <option value="large">Large (201-1000)</option>
                <option value="enterprise">Enterprise (1000+)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {canManageOrganisation && (
        <div className="pt-4 border-t border-gray-200">
          <Button onClick={handleSaveOrganisation} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing & Subscription</h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Pro Plan</h4>
              <p className="text-sm text-blue-700">$49/month • Unlimited assessments</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-700">Next billing date</div>
              <div className="font-medium text-blue-900">February 22, 2024</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Payment Method</h4>
              <p className="text-sm text-gray-500">•••• •••• •••• 4242</p>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Billing History</h4>
              <p className="text-sm text-gray-500">View past invoices and receipts</p>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive updates about your assessments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Session Management</h4>
              <p className="text-sm text-gray-500">Manage your active sessions</p>
            </div>
            <Button variant="outline" size="sm">
              View Sessions
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Data Export</h4>
              <p className="text-sm text-gray-500">Download your data</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPasswordPolicySection = () => (
    <div className="space-y-6">
      <PasswordRequirementsManager
        organisationId={organisation.id}
        userId={user.id}
        userRole={member.role}
      />
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'organisation':
        return renderOrganisationSection();
      case 'billing':
        return renderBillingSection();
      case 'security':
        return renderSecuritySection();
      case 'password':
        return renderPasswordPolicySection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and organisation preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {visibleSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${activeSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
}