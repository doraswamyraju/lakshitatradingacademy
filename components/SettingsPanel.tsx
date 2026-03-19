
import React from 'react';
import { Key, Shield, Globe, Power, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { BrokerConfig } from '../types';
import { useAuth } from '../context/AuthContext';

interface SettingsPanelProps {
  config: BrokerConfig;
  setConfig: React.Dispatch<React.SetStateAction<BrokerConfig>>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig }) => {
  const { token } = useAuth();
  const handleConnect = async () => {
    if (config.apiKey && config.clientCode) {
      const newConfig = { ...config, isConnected: true };
      setConfig(newConfig);
      
      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(newConfig)
        });
      } catch (err) {
        console.error("Failed to save to backend", err);
      }
    }
  };

  const handleDisconnect = async () => {
    const newConfig = { ...config, isConnected: false };
    setConfig(newConfig);
    
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newConfig)
      });
    } catch (err) {
      console.error("Failed to save to backend", err);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Broker Connectivity</h2>
        <p className="text-sm text-gray-500">Connect your trading account to enable automated strategy execution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-samp-surface border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-samp-primary/10 rounded-lg text-samp-primary">
                <Globe size={20} />
             </div>
             <h3 className="font-bold text-white">Select Broker</h3>
          </div>

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
                  placeholder="••••••••••••"
                />
             </div>
          </div>

          {!config.isConnected ? (
            <button 
              onClick={handleConnect}
              className="w-full bg-samp-primary hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Power size={18} /> Connect API
            </button>
          ) : (
            <button 
              onClick={handleDisconnect}
              className="w-full bg-samp-danger/20 hover:bg-samp-danger/30 text-samp-danger font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-samp-danger/20"
            >
              <X size={18} /> Disconnect Broker
            </button>
          )}
        </div>

        <div className="space-y-6">
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

           <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-6 flex gap-4">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div className="space-y-2">
                 <h4 className="text-sm font-bold text-amber-500">Important Note</h4>
                 <p className="text-xs text-amber-500/70 leading-relaxed">
                    Automated trading carries high risk. Ensure your API keys have restricted permissions (only 'Trade' and 'Order' access). Never share your API Secret.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
