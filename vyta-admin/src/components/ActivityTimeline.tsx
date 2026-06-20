import React, { useState, useEffect } from 'react';
import { Activity, LogIn, LogOut, Shield, Monitor, Globe, Clock, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import { getUserTimeline } from '../api/adminManagement';
import { listAdminUsers } from '../api/adminUsers';
import type { TimelineEvent, AdminUserResponse } from '../api/types';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  audit: <Shield size={14} className="text-blue-500" />,
  login: <LogIn size={14} className="text-green-500" />,
  session: <Monitor size={14} className="text-purple-500" />,
};

const EVENT_COLORS: Record<string, string> = {
  audit: 'border-l-blue-400',
  login: 'border-l-green-400',
  session: 'border-l-purple-400',
};

export default function ActivityTimeline() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast, toastContainer } = useToast();

  useEffect(() => {
    listAdminUsers({ limit: 200 }).then(res => setUsers(res.items)).catch(() => {});
  }, []);

  const fetchTimeline = async (userId: string) => {
    setLoading(true);
    try {
      const data = await getUserTimeline(userId, 100);
      setEvents(data);
    } catch {
      addToast('error', 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    if (userId) fetchTimeline(userId);
    else setEvents([]);
  };

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>Activity Timeline</h3>
          <div className="flex items-center space-x-2">
            <select value={selectedUser} onChange={e => handleUserChange(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 w-64">
              <option value="">-- Select a user --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
            {selectedUser && (
              <button onClick={() => fetchTimeline(selectedUser)} className="btn-secondary text-xs px-2 py-1"><RefreshCw size={12} /></button>
            )}
          </div>
        </div>

        {!selectedUser ? (
          <div className="p-6 text-center text-gray-400 text-sm">Select an admin user to view their activity timeline</div>
        ) : loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">Loading timeline...</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No activity found for this user</div>
        ) : (
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-0">
              {events.map((event, i) => (
                <div key={`${event.id}-${i}`} className={`flex items-start space-x-3 pl-3 py-2 border-l-2 ${EVENT_COLORS[event.event_type] || 'border-l-gray-300'}`}>
                  <div className="mt-0.5 shrink-0">{EVENT_ICONS[event.event_type] || <Activity size={14} className="text-gray-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 capitalize">{event.description}</span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                    {event.details && (
                      <pre className="text-[10px] text-gray-500 mt-0.5 truncate">{JSON.stringify(event.details)}</pre>
                    )}
                    {event.ip_address && (
                      <span className="text-[10px] text-gray-400"><Globe size={9} className="inline mr-0.5" />{event.ip_address}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
