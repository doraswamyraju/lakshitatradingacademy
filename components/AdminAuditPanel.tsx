import React, { useEffect, useState } from 'react';
import { Activity, Shield, User, Clock, Search, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  message: string;
  userId: string;
  user?: { username: string };
}

import { io } from 'socket.io-client';

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
      const res = await fetch(`/api/algo/logs?all=true&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLogs(data.logs);
    } catch (err) {
      console.error('Failed to fetch admin logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLogs();
    const interval = setInterval(fetchAllLogs, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.userId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-6 flex flex-col h-full shadow-2xl transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-samp-primary/10 rounded-xl text-samp-primary">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Global Audit Feed</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Unified Strategy Monitoring</p>
          </div>
        </div>
        
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search User ID or Event..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-white outline-none focus:border-samp-primary w-[250px] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs font-mono animate-pulse">
            Fetching cross-user audit data...
          </div>
        ) : filteredLogs.map((log) => (
          <div key={log.id} className="group p-3 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-black/40 rounded-xl border border-slate-200 dark:border-white/5 transition-all">
            <div className="flex items-center gap-4 mb-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-samp-primary/10 rounded text-[9px] font-bold text-samp-primary uppercase">
                <User size={10} /> {log.userId.substring(0, 8)}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-[11px] leading-relaxed text-slate-700 dark:text-gray-400 font-mono break-all">
              {log.message}
            </div>
          </div>
        ))}
        {!loading && filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
            <Activity size={48} className="mb-4 stroke-[1]" />
            <p className="text-xs font-mono uppercase tracking-widest font-black">No activity found</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest">Live Engine Status: ACTIVE</span>
        <button onClick={fetchAllLogs} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-samp-primary transition-all">
          <RefreshCcw size={14} />
        </button>
      </div>
    </div>
  );
};

import { RefreshCcw } from 'lucide-react';
export default AdminAuditPanel;
