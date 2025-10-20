import React, { useState } from 'react';
import { Shield, Building, Key, Bell, Globe } from 'lucide-react';
import { PasswordRequirementsManager } from './PasswordRequirementsManager';
import type { User } from '../../types/admin';

interface AdminSettingsProps {
  currentUser: User;
  organisationId: string;
}

export function AdminSettings({ currentUser, organisationId }: AdminSettingsProps) {
  const [activeSection, setActiveSection] = useState<'password' | 'general' | 'security' | 'notifications'>('password');

  const sections = [
    { id: 'password', label: 'Password Policy', icon: Key },
    { id: 'general', label: 'General', icon: Building },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const renderPasswordSection = () => (
    <div className="space-y-6">
      <PasswordRequirementsManager
        organisationId={organisationId}
        userId={currentUser.id}
        userRole={currentUser.role}
      />
    </div>
  );

  const renderGeneralSection = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Building className="w-6 h-6 text-blue-600 mr-3" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure general application settings
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organisation Name
          </label>
          <input
            type="text"
            defaultValue="Demo Organisation"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter organisation name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Language
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 text-blue-600 mr-3" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure security and authentication settings
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500">Require 2FA for all admin users</p>
          </div>
          <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        </label>

        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Session Timeout</h4>
            <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </label>

        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">IP Allowlist</h4>
            <p className="text-sm text-gray-500">Restrict access to specific IP addresses</p>
          </div>
          <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        </label>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Bell className="w-6 h-6 text-blue-600 mr-3" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure email and system notifications
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">New User Signups</h4>
            <p className="text-sm text-gray-500">Notify admins when new users register</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        </label>

        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Assessment Completion</h4>
            <p className="text-sm text-gray-500">Notify facilitators when assessments are completed</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        </label>

        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">System Alerts</h4>
            <p className="text-sm text-gray-500">Receive alerts about system issues</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        </label>

        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Weekly Reports</h4>
            <p className="text-sm text-gray-500">Receive weekly summary reports</p>
          </div>
          <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        </label>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'password':
        return renderPasswordSection();
      case 'general':
        return renderGeneralSection();
      case 'security':
        return renderSecuritySection();
      case 'notifications':
        return renderNotificationsSection();
      default:
        return renderPasswordSection();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage system-wide settings and configurations
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {sections.map((section) => {
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
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}
