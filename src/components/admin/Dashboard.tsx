import React from 'react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
  Plus
} from 'lucide-react';
import { Button } from '../common/Button';
import type { AdminDashboardStats, Session } from '../../types/admin';

interface DashboardProps {
  stats: AdminDashboardStats;
  onCreateSession: () => void;
  onCreateTemplate: () => void;
  onUploadCSV: () => void;
}

export function Dashboard({ stats, onCreateSession, onCreateTemplate, onUploadCSV }: DashboardProps) {
  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: Play,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Total Participants',
      value: stats.totalParticipants,
      icon: Users,
      color: 'bg-purple-500',
      change: '+18%'
    },
    {
      title: 'Completed Assessments',
      value: stats.completedAssessments,
      icon: CheckCircle,
      color: 'bg-amber-500',
      change: '+23%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your assessments.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <Button onClick={onCreateSession} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
          <Button onClick={onCreateTemplate} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
          <Button onClick={onUploadCSV} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{session.name}</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.status === 'active' ? 'bg-green-100 text-green-800' :
                      session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {session.stats.participantCount} participants
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Archetypes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Popular Archetypes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.popularArchetypes.map((archetype, index) => (
                <div key={archetype.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{archetype.name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${archetype.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {archetype.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}