import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { Plus, LogIn, Clock, Sparkles, Archive, Trash2, ArchiveRestore } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UsernameDialog from './UsernameDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { showSuccess, showError } from '@/utils/toast';

const SessionDashboard: React.FC = () => {
  const [sessionName, setSessionName] = useState('');
  const [joinSessionId, setJoinSessionId] = useState('');
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { createSession, joinSession, setUserName } = useSession();
  const navigate = useNavigate();

  const loadSessions = () => {
    const sessions: any[] = [];
    const archived: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('session_')) {
        const session = JSON.parse(localStorage.getItem(key)!);
        if (session.archived) {
          archived.push(session);
        } else {
          sessions.push(session);
        }
      }
    }
    
    sessions.sort((a, b) => b.lastActivity - a.lastActivity);
    archived.sort((a, b) => b.lastActivity - a.lastActivity);
    
    setRecentSessions(sessions.slice(0, 10));
    setArchivedSessions(archived);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const checkDuplicateName = (name: string): boolean => {
    const allSessions = [...recentSessions, ...archivedSessions];
    return allSessions.some(session => 
      session.name.toLowerCase() === name.toLowerCase()
    );
  };

  const handleCreateSession = () => {
    if (!sessionName.trim()) return;
    
    // Check for duplicate name
    if (checkDuplicateName(sessionName.trim())) {
      showError('A session with this name already exists. Please choose a different name.');
      return;
    }
    
    const sessionId = createSession(sessionName);
    navigate(`/session/${sessionId}`);
  };

  const handleJoinSessionClick = (sessionId: string) => {
    setPendingSessionId(sessionId);
    setUsernameDialogOpen(true);
  };

  const handleUsernameSubmit = (name: string) => {
    setUserName(name);
    setUsernameDialogOpen(false);
    
    if (pendingSessionId) {
      joinSession(pendingSessionId);
      navigate(`/session/${pendingSessionId}`);
      setPendingSessionId(null);
    }
  };

  const handleUsernameCancel = () => {
    setUsernameDialogOpen(false);
    setPendingSessionId(null);
  };

  const handleArchiveSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = JSON.parse(localStorage.getItem(`session_${sessionId}`)!);
    session.archived = true;
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    loadSessions();
    showSuccess('Session archived');
  };

  const handleUnarchiveSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = JSON.parse(localStorage.getItem(`session_${sessionId}`)!);
    session.archived = false;
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    loadSessions();
    showSuccess('Session restored');
  };

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      localStorage.removeItem(`session_${sessionToDelete}`);
      localStorage.removeItem(`canvas_${sessionToDelete}`);
      localStorage.removeItem(`chat_${sessionToDelete}`);
      localStorage.removeItem(`mood_${sessionToDelete}`);
      loadSessions();
      showSuccess('Session deleted');
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const displaySessions = showArchived ? archivedSessions : recentSessions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-lavender-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-purple-500" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              MoodCanvas
            </h1>
            <Sparkles className="w-10 h-10 text-pink-500" />
          </div>
          <p className="text-xl text-purple-700 font-medium">
            AI-Powered Emotional Whiteboard ✨
          </p>
          <p className="text-sm text-purple-600 mt-2">
            Where creativity meets emotion in real-time
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-xl border-2 border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Plus className="w-5 h-5 text-purple-600" />
                Create New Session
              </CardTitle>
              <CardDescription className="text-purple-600">
                Start a new collaborative whiteboard session
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Input
                  placeholder="Session name (e.g., Team Brainstorm)"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                  className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                <Button 
                  onClick={handleCreateSession}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                  disabled={!sessionName.trim()}
                >
                  Create Session ✨
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2 border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <LogIn className="w-5 h-5 text-pink-600" />
                Join Session
              </CardTitle>
              <CardDescription className="text-purple-600">
                Enter a session ID to join an existing session
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Input
                  placeholder="Session ID"
                  value={joinSessionId}
                  onChange={(e) => setJoinSessionId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinSessionClick(joinSessionId)}
                  className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                <Button 
                  onClick={() => handleJoinSessionClick(joinSessionId)}
                  className="w-full border-2 border-purple-300 hover:bg-purple-50 text-purple-700"
                  variant="outline"
                  disabled={!joinSessionId.trim()}
                >
                  Join Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {(recentSessions.length > 0 || archivedSessions.length > 0) && (
          <Card className="shadow-xl border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showArchived ? (
                    <Archive className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-purple-600" />
                  )}
                  <CardTitle className="text-purple-900">
                    {showArchived ? 'Archived Sessions' : 'Recent Sessions'}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="hover:bg-purple-100 text-purple-700"
                >
                  {showArchived ? (
                    <>
                      <Clock className="w-4 h-4 mr-1" />
                      Show Recent
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-1" />
                      Show Archived ({archivedSessions.length})
                    </>
                  )}
                </Button>
              </div>
              <CardDescription className="text-purple-600">
                {showArchived ? 'Your archived sessions' : 'Your last 10 sessions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {displaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border-2 border-purple-100 rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-all group"
                    onClick={() => handleJoinSessionClick(session.id)}
                  >
                    <div>
                      <p className="font-medium text-purple-900">{session.name}</p>
                      <p className="text-sm text-purple-600">
                        {formatDate(session.lastActivity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {showArchived ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleUnarchiveSession(session.id, e)}
                          className="hover:bg-green-100 text-green-700"
                          title="Restore"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleArchiveSession(session.id, e)}
                          className="hover:bg-purple-100 text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(session.id, e)}
                        className="hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-purple-100 text-purple-700"
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <UsernameDialog
        open={usernameDialogOpen}
        onSubmit={handleUsernameSubmit}
        onCancel={handleUsernameCancel}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-2 border-purple-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-900">Delete Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-600">
              This action cannot be undone. This will permanently delete the session and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-300 hover:bg-purple-50 text-purple-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionDashboard;