import React, { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { ProjectsTab } from './tabs/ProjectsTab';
import { AssessmentsTab } from './tabs/AssessmentsTab';
import { TeamTab } from './tabs/TeamTab';
import { PDFsTab } from './tabs/PDFsTab';
import { SettingsTab } from './tabs/SettingsTab';
import type { User, Organisation, OrganisationMember, DashboardStats } from '../../types/auth';

interface UserDashboardProps {
  user: User;
  organisation: Organisation;
  member: OrganisationMember;
  onLogout: () => void;
  onStartAssessment: () => void;
}

export function UserDashboard({ user, organisation, member, onLogout, onStartAssessment }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'assessments' | 'team' | 'pdfs' | 'settings'>('assessments');

  // Mock dashboard stats
  const stats: DashboardStats = {
    projectCount: 3,
    assessmentCount: 8,
    totalParticipants: 45,
    completedAssessments: 32,
    recentActivity: [
      {
        id: '1',
        type: 'assessment_created',
        description: 'New assessment "Brand Identity Workshop" created',
        timestamp: new Date('2024-01-22T10:30:00Z')
      },
      {
        id: '2',
        type: 'participant_completed',
        description: 'Sarah Johnson completed "Leadership Assessment"',
        timestamp: new Date('2024-01-22T09:15:00Z')
      },
      {
        id: '3',
        type: 'invite_sent',
        description: '5 team members invited to "Marketing Team Assessment"',
        timestamp: new Date('2024-01-21T16:45:00Z')
      }
    ]
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'assessments':
        return <AssessmentsTab organisation={organisation} member={member} />;
      case 'team':
        return <TeamTab organisation={organisation} member={member} />;
      case 'pdfs':
        return <PDFsTab organisation={organisation} member={member} />;
      case 'settings':
        return <SettingsTab user={user} organisation={organisation} member={member} />;
      default:
        return <AssessmentsTab organisation={organisation} member={member} />;
    }
  };

  return (
    <DashboardLayout
      user={user}
      organisation={organisation}
      member={member}
      stats={stats}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
      onStartAssessment={onStartAssessment}
    >
      {renderActiveTab()}
    </DashboardLayout>
  );
}