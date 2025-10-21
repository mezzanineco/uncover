import React, { useState, useContext } from 'react';
import { AdminLayout } from './AdminLayout';
import { Dashboard } from './Dashboard';
import { QuestionBankManager } from './QuestionBankManager';
import { SessionManager } from './SessionManager';
import { ReportsView } from './ReportsView';
import { AdminSettings } from './AdminSettings';
import { loadQuestionsFromCSV } from '../../data/csvLoader';
import { AuthContext } from '../../contexts/AuthContext';
import type { User, QuestionBank, Session } from '../../types/admin';
import type { ParsedQuestion } from '../../types';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'question-banks' | 'sessions' | 'reports' | 'settings'>('dashboard');
  const { user, organisation, member, logout } = useContext(AuthContext);

  // Use auth context for user data, fallback to mock if not available
  const currentUser: User = user ? {
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    role: (member?.role as 'super_admin' | 'facilitator' | 'client_admin') || 'super_admin',
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || new Date()
  } : {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'super_admin',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date()
  };

  // Use auth context for organisation ID, fallback to mock if not available
  const organisationId = organisation?.id || '550e8400-e29b-41d4-a716-446655440010';
  
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
      createdAt: new Date('2024-01-15T10:00:00Z'),
      lastModified: new Date('2024-01-15T10:00:00Z'),
      createdBy: 'admin@example.com'
    },
    {
      id: 'bank-2',
      name: 'Archetype Assessment v2.2',
      version: '2.2',
      status: 'draft',
      questionCount: 45,
      createdAt: new Date('2024-01-20T14:30:00Z'),
      lastModified: new Date('2024-01-22T09:15:00Z'),
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
          ? { ...bank, status: 'published' as const, lastModified: new Date(), publishedAt: new Date() }
          : bank.status === 'published'
          ? { ...bank, status: 'archived' as const, lastModified: new Date() }
          : bank
      )
    );
  };

  const handleArchive = (bankId: string) => {
    setQuestionBanks(banks =>
      banks.map(bank =>
        bank.id === bankId
          ? { ...bank, status: 'archived' as const, lastModified: new Date() }
          : bank
      )
    );
  };

  const handleToggleStatus = (bankId: string) => {
    setQuestionBanks(banks => {
      const targetBank = banks.find(b => b.id === bankId);
      if (!targetBank) return banks;

      let newStatus: 'draft' | 'published' | 'archived';
      if (targetBank.status === 'published') {
        newStatus = 'archived';
      } else if (targetBank.status === 'archived') {
        newStatus = 'draft';
      } else {
        newStatus = 'published';
      }

      return banks.map(bank =>
        bank.id === bankId
          ? { ...bank, status: newStatus, lastModified: new Date(), publishedAt: newStatus === 'published' ? new Date() : bank.publishedAt }
          : newStatus === 'published' && bank.status === 'published'
          ? { ...bank, status: 'archived' as const, lastModified: new Date() }
          : bank
      );
    });
  };

  const handleDelete = (bankId: string) => {
    if (window.confirm('Are you sure you want to delete this question bank? This action cannot be undone.')) {
      setQuestionBanks(banks => banks.filter(bank => bank.id !== bankId));
    }
  };

  const handleDuplicate = (bankId: string) => {
    setQuestionBanks(banks => {
      const bankToDuplicate = banks.find(b => b.id === bankId);
      if (!bankToDuplicate) return banks;

      const newBank: QuestionBank = {
        ...bankToDuplicate,
        id: `bank-${Date.now()}`,
        name: `${bankToDuplicate.name} (Copy)`,
        version: `${parseFloat(bankToDuplicate.version) + 0.1}`,
        status: 'draft',
        createdAt: new Date(),
        lastModified: new Date(),
        publishedAt: undefined
      };

      return [...banks, newBank];
    });
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
    if (logout) {
      logout();
      // Redirect to landing page
      window.location.href = '/';
    } else {
      console.log('Logout function not available');
    }
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
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
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