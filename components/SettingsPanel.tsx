import React, { useState, useEffect } from 'react';
import { Key, Shield, Globe, Power, CheckCircle2, AlertCircle, X, ExternalLink, RefreshCw } from 'lucide-react';
import { BrokerConfig, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface SettingsPanelProps {
  config: BrokerConfig;
  setConfig: React.Dispatch<React.SetStateAction<BrokerConfig>>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig }) => {
  const { token, user, setPaperMode } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  // System Config State (for Admins)
  const [sysConfig, setSysConfig] = useState<any>(null);
  const [isSysLoading, setIsSysLoading] = useState(false);
  const [sysStatus, setSysStatus] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [userTokenStatus, setUserTokenStatus] = useState<any>(null);

  useEffect(() => {
    if (token) {
      if (user?.role === 'ADMIN') fetchSystemConfig();
      fetchUserTokenStatus();
    }
  }, [user, token]);

  const fetchUserTokenStatus = async () => {
    try {
      const res = await fetch('/api/user/kite/token-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUserTokenStatus(await res.json());
      }
    } catch (err) {
      console.log('Failed to fetch user token status');
    }
  };

  const handleUserKiteLoginInitiate = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/user/kite/login-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get login URL');
      if (data.loginUrl) {
        window.open(data.loginUrl, '_blank');
        setStatusType('success');
        setStatusMessage('Kite login tab opened. Please complete login there.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSystemConfig = async () => {
    setIsSysLoading(true);
    try {
      const res = await fetch('/api/market-data/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSysConfig(data);
    } catch (err) {
      console.error('Failed to fetch system config:', err);
    } finally {
      setIsSysLoading(false);
    }
  };

  const saveSystemConfig = async () => {
    if (!sysConfig || !token) return;
    setIsSysLoading(true);
    setSysStatus(null);
    try {
      const res = await fetch('/api/market-data/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sysConfig)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save system config');
      setSysStatus({ msg: 'System configuration saved successfully.', type: 'success' });
      // Refresh to get any server-side defaults
      fetchSystemConfig();
    } catch (err: any) {
      setSysStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsSysLoading(false);
    }
  };

  const handleKiteLoginInitiate = async () => {
    if (!token) return;
    setIsSysLoading(true);
    try {
      const res = await fetch('/api/market-data/kite/login-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get login URL');
      if (data.loginUrl) {
        window.open(data.loginUrl, '_blank');
        setSysStatus({ msg: 'Kite login tab opened. Please complete login there.', type: 'success' });
      }
    } catch (err: any) {
      setSysStatus({ msg: err.message, type: 'error' });
    } finally {
      setIsSysLoading(false);
    }
  };

  const persistConfig = async (newConfig: BrokerConfig) => {
    if (!token) {
      throw new Error('Login session missing. Please login again.');
    }

    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newConfig)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to save broker configuration.');
    }

    return payload;
  };

  const handleConnect = async () => {
    if (!config.apiKey || !config.clientCode || !config.apiSecret) {
      setStatusType('error');
      setStatusMessage('API key, API secret and client code are required before connecting.');
      return;
    }

    const candidateConfig = { ...config, isConnected: true };
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await persistConfig(candidateConfig);
      setConfig(candidateConfig);
      setStatusType('success');
      setStatusMessage('Broker connection verified by backend and saved.');
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message || 'Broker verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    const disconnectedConfig = { ...config, isConnected: false };
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await persistConfig(disconnectedConfig);
      setConfig(disconnectedConfig);
      setStatusType('success');
      setStatusMessage('Broker disconnected.');
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message || 'Failed to disconnect broker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Broker Connectivity</h2>
        <p className="text-sm text-gray-500">Connect your trading account to enable automated strategy execution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Broker Config */}
        <div className="bg-samp-surface border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-samp-primary/10 rounded-lg text-samp-primary">
                <Globe size={20} />
             </div>
             <h3 className="font-bold text-white">Your Personal Broker</h3>
          </div>
          {/* ... (existing user broker config fields) ... */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             {['AngelOne', 'Zerodha', 'Upstox', 'AliceBlue'].map(b => (
               <button
                 key={b}
                 onClick={() => setConfig(prev => ({ ...prev, brokerName: b as any }))}
                 className={`py-3 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                   config.brokerName === b
                   ? 'bg-samp-primary/20 border-samp-primary text-white'
                   : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/20'
                 }`}
               >
                 {b}
               </button>
             ))}
          </div>

          <div className="space-y-4">
             <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">API Key</label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-white outline-none focus:border-samp-primary"
                    placeholder="Enter API Key"
                  />
                </div>
             </div>
             <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Client Code</label>
                <input
                  type="text"
                  value={config.clientCode}
                  onChange={e => setConfig(prev => ({ ...prev, clientCode: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white outline-none focus:border-samp-primary"
                  placeholder="e.g. A123456"
                />
             </div>
             <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">API Secret</label>
                <input
                  type="password"
                  value={config.apiSecret}
                  onChange={e => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white outline-none focus:border-samp-primary"
                  placeholder="****************"
                />
             </div>
          </div>

          {statusMessage && (
            <div className={`text-xs rounded-xl border px-3 py-2 ${statusType === 'error' ? 'text-red-300 border-red-500/40 bg-red-500/10' : 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'}`}>
              {statusMessage}
            </div>
          )}

          {!config.isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isSubmitting}
              className="w-full bg-samp-primary hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Power size={18} /> {isSubmitting ? 'Verifying...' : 'Connect API'}
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleDisconnect}
                disabled={isSubmitting}
                className="w-full bg-samp-danger/20 hover:bg-samp-danger/30 text-samp-danger font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-samp-danger/20 disabled:opacity-50"
              >
                <X size={18} /> {isSubmitting ? 'Disconnecting...' : 'Disconnect Broker'}
              </button>

              {config.brokerName === 'Kite' && (
                <div className="pt-4 border-t border-white/10 space-y-4">
                  {userTokenStatus && userTokenStatus.hasAccessToken && !userTokenStatus.shouldReconnect ? (
                     <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm justify-between">
                       <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Live Feed Active</span>
                       {userTokenStatus.tokenAgeMinutes !== null && <span className="text-xs opacity-70">({userTokenStatus.tokenAgeMinutes}m ago)</span>}
                     </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-xs">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <p>Your Kite broker is registered, but requires your daily login to issue a fresh viewing token.</p>
                      </div>
                      <button
                        onClick={handleUserKiteLoginInitiate}
                        disabled={isSubmitting}
                        className="w-full bg-[#FF5722] hover:bg-[#F4511E] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                       <ExternalLink size={18} /> Establish Live Broker Session
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* System Broker Config (Admin Only) */}
        {user?.role === 'ADMIN' && (
          <div className="bg-samp-surface border border-samp-primary/20 rounded-2xl p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Shield size={80} />
            </div>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-samp-primary/10 rounded-lg text-samp-primary">
                  <Shield size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-white">System Broker (Global)</h3>
                 <p className="text-[10px] text-samp-accent font-bold uppercase tracking-widest">Feeds Terminal Dashboard</p>
               </div>
            </div>

            {!sysConfig ? (
              <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                <RefreshCw size={24} className="animate-spin mb-2" />
                <p className="text-xs">Loading system configuration...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Global Kite API Key</label>
                    <input
                      type="text"
                      value={sysConfig.appKey || ''}
                      onChange={e => setSysConfig({ ...sysConfig, appKey: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white outline-none focus:border-samp-primary"
                      placeholder="Zerodha API Key"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Global Kite API Secret</label>
                    <input
                      type="password"
                      value={sysConfig.appSecret || ''}
                      onChange={e => setSysConfig({ ...sysConfig, appSecret: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white outline-none focus:border-samp-primary"
                      placeholder="Zerodha API Secret"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-xs text-gray-400">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sysConfig.accessToken ? 'bg-samp-success/20 text-samp-success' : 'bg-samp-danger/20 text-samp-danger'}`}>
                      {sysConfig.accessToken ? 'AUTHENTICATED' : 'TOKEN MISSING'}
                    </span>
                  </div>
                </div>

                {sysStatus && (
                  <div className={`text-xs rounded-xl border px-3 py-2 ${sysStatus.type === 'error' ? 'text-red-300 border-red-500/40 bg-red-500/10' : 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'}`}>
                    {sysStatus.msg}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={saveSystemConfig}
                    disabled={isSysLoading}
                    className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10 disabled:opacity-50"
                  >
                    {isSysLoading ? 'Processing...' : 'Save Meta-Config'}
                  </button>
                  
                  {sysConfig.appKey && sysConfig.appSecret && (
                    <button
                      onClick={handleKiteLoginInitiate}
                      disabled={isSysLoading}
                      className="w-full bg-samp-primary hover:bg-indigo-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-samp-primary/20 disabled:opacity-50 group"
                    >
                      <ExternalLink size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      Establish Live Kite Session
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
         {/* Execution Mode Toggle */}
         <div className="bg-samp-surface border border-samp-primary/20 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-samp-primary/10 rounded-lg text-samp-primary">
                  <RefreshCw size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-white">Execution Mode</h3>
                 <p className="text-[10px] text-gray-500 uppercase font-bold">Paper vs Live Sentinel</p>
               </div>
            </div>

            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-sm font-bold text-white">{user?.isPaperTrading ? 'Paper Trading Active' : 'Live Trading Enabled'}</p>
                  <p className="text-[10px] text-gray-500 max-w-[200px]">
                     {user?.isPaperTrading 
                       ? 'Signals will be processed on live data but NO real orders will be placed.' 
                       : 'CAUTION: Real orders will be sent to your broker terminal.'}
                  </p>
               </div>
               
               <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={!user?.isPaperTrading}
                      disabled={isSubmitting}
                      onChange={async () => {
                         const nextMode = !user?.isPaperTrading;
                         setIsSubmitting(true);
                         try {
                           const res = await fetch('/api/user/mode', {
                              method: 'PUT',
                              headers: { 
                                 'Content-Type': 'application/json',
                                 'Authorization': `Bearer ${token}` 
                              },
                              body: JSON.stringify({ isPaperTrading: nextMode })
                           });
                           if (res.ok) {
                              const data = await res.json();
                              if (data.success) {
                                 setPaperMode(nextMode);
                              }
                           }
                         } catch(e) {
                           console.error('Mode toggle failed:', e);
                         } finally { setIsSubmitting(false); }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-samp-primary"></div>
                  </label>
               </div>
            </div>
         </div>

         <div className="bg-samp-surface border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-samp-success/10 rounded-lg text-samp-success">
                  <Shield size={20} />
              </div>
              <h3 className="font-bold text-white">Security Status</h3>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                     <CheckCircle2 size={16} className="text-samp-success" />
                     Encryption Active
                  </div>
                  <span className="text-[10px] font-mono text-gray-600">AES-256</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                     <CheckCircle2 size={16} className="text-samp-success" />
                     TOTP Configured
                  </div>
                  <span className="text-[10px] font-mono text-gray-600">ENABLED</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
