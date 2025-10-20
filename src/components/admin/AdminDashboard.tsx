import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Dashboard } from './Dashboard';
import { QuestionBankManager } from './QuestionBankManager';
import { SessionManager } from './SessionManager';
import { ReportsView } from './ReportsView';
import { AdminSettings } from './AdminSettings';
import { loadQuestionsFromCSV } from '../../data/csvLoader';
import type { User, QuestionBank, Session } from '../../types/admin';
import type { ParsedQuestion } from '../../types';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'question-banks' | 'sessions' | 'reports' | 'settings'>('dashboard');
  
  // Mock current user - in production this would come from auth context
  const currentUser: User = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'super_admin',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date()
  };

  // Mock organisation ID - in production this would come from auth context
  const organisationId = '00000000-0000-0000-0000-000000000001';
  
  const [sessions] = useState<Session[]>([
    {
      id: 'session-1',
      name: 'Team Workshop - Marketing',
      templateId: 'template-1',
      mode: 'workshop',
      status: 'active',
      joinLink: 'https://app.example.com/join/ABC123',
      roomCode: 'ABC123',
      stats: {
        participantCount: 8,
        completedCount: 5,
        averageCompletionTime: 12
      },
      config: {
        allowAnonymous: true,
        showLiveResults: true
      },
      createdAt: '2024-01-22T09:00:00Z',
      facilitatorId: 'facilitator-1'
    },
    {
      id: 'session-2',
      name: 'Async Assessment - Sales Team',
      templateId: 'template-1', 
      mode: 'async',
      status: 'completed',
      joinLink: 'https://app.example.com/join/XYZ789',
      roomCode: 'XYZ789',
      stats: {
        participantCount: 12,
        completedCount: 12,
        averageCompletionTime: 15
      },
      config: {
        allowAnonymous: false,
        showLiveResults: false
      },
      createdAt: '2024-01-20T15:30:00Z',
      facilitatorId: 'facilitator-1'
    },
    {
      id: 'session-3',
      name: 'Leadership Evaluation',
      templateId: 'template-1',
      mode: 'workshop',
      status: 'completed',
      joinLink: 'https://app.example.com/join/DEF456',
      roomCode: 'DEF456',
      stats: {
        participantCount: 6,
        completedCount: 6,
        averageCompletionTime: 18
      },
      config: {
        allowAnonymous: true,
        showLiveResults: true
      },
      createdAt: '2024-01-18T14:00:00Z',
      facilitatorId: 'facilitator-1'
    }
  ]);

  // Mock data - in production this would come from API
  const [stats] = useState({
    totalSessions: 24,
    activeSessions: 3,
    totalParticipants: 156,
    completionRate: 87,
    completedAssessments: 142,
    recentSessions: sessions.slice(0, 3),
    popularArchetypes: [
      { name: 'Explorer', count: 28, percentage: 18 },
      { name: 'Creator', count: 24, percentage: 15 },
      { name: 'Hero', count: 22, percentage: 14 }
    ]
  });

  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([
    {
      id: 'bank-1',
      name: 'Archetype Assessment v2.1',
      version: '2.1',
      status: 'published',
      questionCount: 42,
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin@example.com'
    },
    {
      id: 'bank-2', 
      name: 'Archetype Assessment v2.2',
      version: '2.2',
      status: 'draft',
      questionCount: 45,
      createdAt: '2024-01-20T14:30:00Z',
      createdBy: 'admin@example.com'
    }
  ]);

  const [questions, setQuestions] = useState<ParsedQuestion[]>(() => {
    const loadedQuestions = loadQuestionsFromCSV();
    return loadedQuestions.map(q => ({
      ...q,
      status: 'active' as const,
      usedInSessions: Math.random() > 0.7 // Randomly assign some as used
    }));
  });

  // Question management handlers
  const handleUpload = async (file: File) => {
    console.log('Uploading file:', file.name);
    // In production, this would upload to server and parse CSV
  };

  const handlePublish = (bankId: string) => {
    setQuestionBanks(banks => 
      banks.map(bank => 
        bank.id === bankId 
          ? { ...bank, status: 'published' as const }
          : bank
      )
    );
  };

  const handleArchive = (bankId: string) => {
    setQuestionBanks(banks =>
      banks.map(bank =>
        bank.id === bankId
          ? { ...bank, status: 'archived' as const }
          : bank
      )
    );
  };

  const handlePreview = (bankId: string) => {
    console.log('Previewing bank:', bankId);
  };

  const handleEdit = (bankId: string) => {
    console.log('Editing bank:', bankId);
  };

  const handleAddQuestion = (question: ParsedQuestion) => {
    const newQuestion = {
      ...question,
      id: `Q${Date.now()}`,
      status: 'active' as const,
      usedInSessions: false
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleUpdateQuestion = (updatedQuestion: ParsedQuestion) => {
    setQuestions(prev =>
      prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
    );
  };

  const handleArchiveQuestion = (questionId: string) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, status: 'archived' as const }
          : q
      )
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  // Dashboard handlers
  const handleCreateSession = () => {
    console.log('Creating new session');
    setCurrentView('sessions');
  };

  const handleCreateTemplate = () => {
    console.log('Creating new template');
  };

  const handleUploadCSV = () => {
    console.log('Uploading CSV');
    setCurrentView('question-banks');
  };

  const handleLogout = () => {
    console.log('Logging out');
    // In production, this would clear auth and redirect
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            recentSessions={sessions.slice(0, 5)}
            onCreateSession={handleCreateSession}
            onCreateTemplate={handleCreateTemplate}
            onUploadCSV={handleUploadCSV}
          />
        );
      case 'question-banks':
        return (
          <QuestionBankManager
            questionBanks={questionBanks}
            questions={questions}
            onUpload={handleUpload}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onArchiveQuestion={handleArchiveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        );
      case 'sessions':
        return (
          <SessionManager
            sessions={sessions}
            onCreateSession={handleCreateSession}
            onStartSession={(id) => console.log('Starting session:', id)}
            onPauseSession={(id) => console.log('Pausing session:', id)}
            onStopSession={(id) => console.log('Stopping session:', id)}
            onViewSession={(id) => console.log('Viewing session:', id)}
            onCopyJoinLink={(link) => navigator.clipboard.writeText(link)}
          />
        );
      case 'reports':
        return (
          <ReportsView
            organisationId={organisationId}
            currentUserId={currentUser.id}
          />
        );
      case 'settings':
        return (
          <AdminSettings
            currentUser={currentUser}
            organisationId={organisationId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout
      currentUser={currentUser}
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={handleLogout}
    >
      {renderCurrentView()}
    </AdminLayout>
  );
}