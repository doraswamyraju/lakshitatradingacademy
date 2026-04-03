import React, { useEffect, useState } from 'react';
import { Search, Activity, ShieldAlert, RefreshCcw, User, Clock } from 'lucide-react';
import { io } from 'socket.io-client';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  symbol: string;
  price: number;
  qty: number;
  status: string;
  message: string;
  timestamp: string;
  user?: { username: string };
}

const AdminAuditPanel: React.FC<{ token: string }> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io({ path: '/api/socket.io' });
    socket.on('admin_log', (newLog: any) => {
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    });
    return () => { socket.disconnect(); };
  }, []);

  const fetchAllLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/algo/logs?all=true&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllLogs();
  }, [token]);

  const filteredLogs = logs.filter(l => 
    l.message?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    l.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-samp-danger" size={24} /> Global Audit Feed
        </h3>
        <button 
          onClick={fetchAllLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-samp-primary/10 text-samp-primary rounded-xl hover:bg-samp-primary hover:text-white transition-all active:scale-95 text-xs font-bold font-mono"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> REFRESH DATA
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search User ID or Event..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all"
        />
      </div>

      <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500">
              <tr>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest">User / Identity</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Event Description</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Instrument</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Activity className="text-slate-300 dark:text-gray-700 animate-pulse" size={48} />
                      <p className="text-slate-400 dark:text-gray-500 font-mono text-sm uppercase tracking-widest">No Activity Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-samp-primary/10 flex items-center justify-center text-[10px] font-bold text-samp-primary">
                          {(log.user?.username || 'SYS').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{log.user?.username || 'SYSTEM'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {log.userId.split('-')[0]}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-medium text-slate-700 dark:text-gray-300 max-w-sm truncate">{log.message}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{log.action}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{log.symbol}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-samp-success/20 text-samp-success' : 'bg-samp-danger/20 text-samp-danger'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditPanel;
