import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  Copy,
  QrCode,
  BarChart3,
  Settings,
  Plus,
  Eye
} from 'lucide-react';
import { Button } from '../common/Button';
import type { Session, SessionStats } from '../../types/admin';

interface SessionManagerProps {
  sessions: Session[];
  onCreateSession: () => void;
  onStartSession: (sessionId: string) => void;
  onPauseSession: (sessionId: string) => void;
  onStopSession: (sessionId: string) => void;
  onViewSession: (sessionId: string) => void;
  onCopyJoinLink: (joinLink: string) => void;
}

export function SessionManager({ 
  sessions, 
  onCreateSession, 
  onStartSession, 
  onPauseSession, 
  onStopSession, 
  onViewSession,
  onCopyJoinLink 
}: SessionManagerProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeIcon = (mode: Session['mode']) => {
    return mode === 'workshop' ? <Users className="w-4 h-4" /> : <Clock className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-1">Create and manage assessment sessions.</p>
        </div>
        
        <Button onClick={onCreateSession}>
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                <div className="flex items-center mt-1">
                  {getModeIcon(session.mode)}
                  <span className="text-sm text-gray-500 ml-1 capitalize">{session.mode}</span>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{session.stats.participantCount}</div>
                <div className="text-xs text-gray-500">Participants</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{session.stats.completedCount}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>

            {/* Room Code */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-900">Room Code</div>
                  <div className="text-lg font-bold text-blue-600">{session.roomCode}</div>
                </div>
                <button
                  onClick={() => onCopyJoinLink(session.joinLink)}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {session.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={() => onStartSession(session.id)}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}
              
              {session.status === 'active' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPauseSession(session.id)}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStopSession(session.id)}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </>
              )}

              {session.status === 'paused' && (
                <Button
                  size="sm"
                  onClick={() => onStartSession(session.id)}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewSession(session.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Session Monitor */}
      {selectedSession && selectedSession.status === 'active' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Live Session: {selectedSession.name}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{selectedSession.stats.participantCount}</div>
                <div className="text-sm text-gray-500">Active Participants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round((selectedSession.stats.completedCount / selectedSession.stats.participantCount) * 100) || 0}%
                </div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {selectedSession.stats.averageCompletionTime || 0}m
                </div>
                <div className="text-sm text-gray-500">Avg. Time</div>
              </div>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <Button variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                Show QR Code
              </Button>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Live Results
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Session Controls
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}