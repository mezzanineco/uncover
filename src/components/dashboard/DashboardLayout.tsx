import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  FileText,
  Users,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Plus,
  Compass,
  Crown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button } from '../common/Button';
import type { User, Organisation, OrganisationMember, DashboardStats } from '../../types/auth';
import { hasPermission } from '../../types/auth';
import { supabase } from '../../lib/supabase';

interface DashboardLayoutProps {
  user: User;
  organisation: Organisation;
  member: OrganisationMember;
  stats: DashboardStats;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onStartAssessment: () => void;
  children: React.ReactNode;
}

export function DashboardLayout({
  user,
  organisation,
  member,
  stats,
  activeTab,
  onTabChange,
  onLogout,
  onStartAssessment,
  children
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dynamicAssessmentCount, setDynamicAssessmentCount] = useState(0);
  const [dynamicUserCount, setDynamicUserCount] = useState(0);
  const [dynamicMemberStats, setDynamicMemberStats] = useState({ accepted: 0, invited: 0 });

  // Fetch assessment count from database
  const fetchAssessmentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching assessment count:', error);
      return 0;
    }
  };

  // Fetch active team member count for the organisation
  const fetchTeamMemberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('organisation_members')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', organisation.id)
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching team member count:', error);
      return 0;
    }
  };

  // Calculate dynamic member stats
  const calculateMemberStats = () => {
    try {
      // Count actual team members from localStorage
      const storedMembers = localStorage.getItem('teamMembers');
      const teamMembers = storedMembers ? JSON.parse(storedMembers) : [];
      const acceptedMembers = teamMembers.filter((member: any) => member.status === 'active').length;

      // Count pending invites
      const storedInvites = localStorage.getItem('pendingInvites');
      const pendingInvites = storedInvites ? JSON.parse(storedInvites) : [];
      const invitedCount = pendingInvites.length;

      return { accepted: acceptedMembers, invited: invitedCount };
    } catch (error) {
      console.error('Error calculating member stats:', error);
      return { accepted: 0, invited: 0 }; // Fallback to zero
    }
  };

  // Update count on mount and when assessments change
  useEffect(() => {
    const updateCounts = async () => {
      const assessmentCount = await fetchAssessmentCount();
      const memberCount = await fetchTeamMemberCount();
      setDynamicAssessmentCount(assessmentCount);
      setDynamicUserCount(memberCount);
      setDynamicMemberStats(calculateMemberStats());
    };

    updateCounts();

    // Listen for assessment changes
    const handleAssessmentChange = async () => {
      const count = await fetchAssessmentCount();
      setDynamicAssessmentCount(count);
    };

    // Listen for invite changes
    const handleInviteChange = () => {
      setDynamicMemberStats(calculateMemberStats());
    };

    // Listen for team member changes
    const handleTeamMemberChange = async () => {
      const count = await fetchTeamMemberCount();
      setDynamicUserCount(count);
    };

    window.addEventListener('assessmentSaved', handleAssessmentChange);
    window.addEventListener('assessmentCompleted', handleAssessmentChange);
    window.addEventListener('storage', handleAssessmentChange);
    window.addEventListener('inviteChange', handleInviteChange);
    window.addEventListener('teamMemberChange', handleTeamMemberChange);

    return () => {
      window.removeEventListener('assessmentSaved', handleAssessmentChange);
      window.removeEventListener('assessmentCompleted', handleAssessmentChange);
      window.removeEventListener('storage', handleAssessmentChange);
      window.removeEventListener('inviteChange', handleInviteChange);
      window.removeEventListener('teamMemberChange', handleTeamMemberChange);
    };
  }, []);

  const navigationItems = [
    {
      id: 'assessments',
      label: 'Assessments',
      icon: FileText,
      permission: 'VIEW_ORGANISATION' as const,
      count: dynamicAssessmentCount
    },
    {
      id: 'team',
      label: 'Team',
      icon: Users,
      permission: 'VIEW_MEMBERS' as const,
      count: dynamicUserCount
    },
    { 
      id: 'pdfs', 
      label: 'PDFs', 
      icon: Download, 
      permission: 'VIEW_ORGANISATION' as const
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      permission: 'VIEW_ORGANISATION' as const
    },
  ];

  const visibleItems = navigationItems.filter(item => 
    hasPermission(member.role, item.permission)
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'facilitator': return 'Facilitator';
      case 'user_admin': return 'Admin';
      case 'participant': return 'Participant';
      default: return role;
    }
  };

  const getPlanBadge = () => {
    // Mock plan data - in production this would come from billing
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Crown className="w-3 h-3 mr-1" />
        Pro Plan
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Compass className="w-8 h-8 text-blue-600 mr-2" />
            <span className="text-lg font-bold text-gray-900">Archetype</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organisation info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900 truncate">{organisation.name}</h2>
            {getPlanBadge()}
          </div>
          <p className="text-sm text-gray-500">{getRoleLabel(member.role)}</p>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${activeTab === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                  {item.count !== undefined && (
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${activeTab === item.id
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-blue-600">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 mr-2"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Quick stats */}
              <div className="hidden md:flex items-center space-x-6 ml-4">
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                  <span className="font-medium">{dynamicAssessmentCount}/{dynamicAssessmentCount}</span>
                  <span className="ml-1">assessments</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Activity className="w-4 h-4 mr-1 text-blue-500" />
                  <span className="font-medium">{dynamicMemberStats.accepted}/{dynamicMemberStats.invited}</span>
                  <span className="ml-1">members</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}