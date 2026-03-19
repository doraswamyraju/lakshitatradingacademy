
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShieldCheck, Activity, LineChart, Code2, Settings, User, LogOut, Bell, Menu, X, Sun, Moon, FlaskConical, BookOpen, GraduationCap } from 'lucide-react';
import MarketDashboard from './components/MarketDashboard';
import AILab from './components/AILab';
import AdminPanel from './components/AdminPanel';
import SettingsPanel from './components/SettingsPanel';
import LoginPage from './components/LoginPage';
import BacktestPanel from './components/BacktestPanel';
import StrategyHub from './components/StrategyHub';
import LearnPanel from './components/LearnPanel';
import LandingPage from './components/LandingPage';
import { UserRole, TradingStrategy, BrokerConfig, User as UserType } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'strategy' | 'admin' | 'settings' | 'backtest' | 'hub' | 'learn'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [masterStrategies, setMasterStrategies] = useState<TradingStrategy[]>([
    {
      id: 'm1',
      name: 'Alpha RSI mean rev',
      description: 'Institutional strategy targeting oversold/overbought extremes.',
      entryConditions: [{ id: 'c1', source: 'RSI', operator: '<', targetType: 'VALUE', targetValue: 30, sourceParams: { period: 14 } }],
      exitConditions: [{ id: 'c2', source: 'RSI', operator: '>', targetType: 'VALUE', targetValue: 70, sourceParams: { period: 14 } }],
      timeframe: '15m',
      qty: 1, 
      productType: 'MIS',
      riskConfig: { stopLossPct: 1.5, takeProfitPct: 3.0, trailingStopLoss: false },
      isActive: true,
      createdBy: 'admin',
      isMaster: true
    },
    {
      id: 'm2',
      name: 'Trend Follower LITE',
      description: 'Momentum based strategy for major indices.',
      entryConditions: [{ id: 'c3', source: 'PRICE', operator: 'CROSSOVER', targetType: 'VALUE', targetValue: 0, sourceParams: {} }],
      exitConditions: [{ id: 'c4', source: 'PRICE', operator: '<', targetType: 'VALUE', targetValue: -10, sourceParams: {} }],
      timeframe: '5m',
      qty: 1,
      productType: 'MIS',
      riskConfig: { stopLossPct: 2.0, takeProfitPct: 5.0, trailingStopLoss: true },
      isActive: true,
      createdBy: 'admin',
      isMaster: true
    },
    {
      id: 'm3',
      name: 'HA Trend Continuation',
      description: 'Trade continuation moves near mid-band using strong HA candles with ADX-confirmed trend.',
      entryConditions: [
        { id: 'c5', source: 'ADX', operator: 'BETWEEN', targetType: 'VALUE', targetValue: 50, sourceParams: { period: 14, min: 18 } },
        { id: 'c6', source: 'DI_PLUS', operator: '>', targetType: 'INDICATOR', targetIndicator: 'DI_MINUS', sourceParams: {} },
        { id: 'c7', source: 'PRICE', operator: 'NEAR', targetType: 'INDICATOR', targetIndicator: 'BOLLINGER_MIDDLE', sourceParams: { period: 20, stdDev: 2, tolerancePct: 1 } },
        { id: 'c8', source: 'HEIKIN_ASHI_CANDLE', operator: 'PATTERN_MATCH', targetType: 'VALUE', targetValue: 1, sourceParams: { pattern: 'STRONG_BULLISH_BREAKOUT' } }
      ],
      exitConditions: [
        { id: 'c9', source: 'HEIKIN_ASHI_CANDLE', operator: 'PATTERN_MATCH', targetType: 'VALUE', targetValue: 1, sourceParams: { pattern: 'STRONG_BEARISH' } },
        { id: 'c10', source: 'PRICE', operator: '<=', targetType: 'VALUE', targetValue: 0, sourceParams: { type: 'STRUCTURAL_SL' } }
      ],
      timeframe: '5m',
      qty: 1,
      productType: 'MIS',
      riskConfig: { stopLossPct: 30, takeProfitPct: 0, trailingStopLoss: false }, // Represents SL fallback. Target handled fundamentally by RR 1:3 rules in backend
      isActive: true,
      createdBy: 'admin',
      isMaster: true
    }
  ]);

  const [userStrategies, setUserStrategies] = useState<TradingStrategy[]>([]);

  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>({
    brokerName: 'AngelOne',
    apiKey: '',
    apiSecret: '',
    clientCode: '',
    isConnected: false
  });

  useEffect(() => {
    // Fetch external config from our Node server
    fetch('http://localhost:4000/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
           setBrokerConfig(data);
        }
      })
      .catch(err => console.log('Backend not reachable:', err));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogin = (role: UserRole) => {
    setCurrentUser({
      id: Math.random().toString(),
      username: role === 'ADMIN' ? 'Admin_Master' : 'Retail_Trader',
      role: role
    });
    setActiveTab(role === 'ADMIN' ? 'admin' : 'learn');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const copyToUserNamespace = (strategy: TradingStrategy, units: number) => {
    const newUserStrategy: TradingStrategy = {
      ...strategy,
      id: `u-${Date.now()}`,
      qty: units,
      createdBy: 'user',
      isMaster: false,
      isActive: true
    };
    setUserStrategies(prev => [...prev, newUserStrategy]);
    setActiveTab('dashboard'); 
  };

  const removeUserStrategy = (id: string) => {
    setUserStrategies(prev => prev.filter(s => s.id !== id));
  };

  if (showLanding && !currentUser) {
    return <LandingPage onLogin={() => setShowLanding(false)} />;
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} onBack={() => setShowLanding(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050508] text-slate-900 dark:text-gray-200 font-sans flex overflow-hidden selection:bg-samp-primary/30 transition-colors duration-300">
      
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-samp-surface border-r border-slate-200 dark:border-white/5 flex flex-col justify-between flex-shrink-0 z-20 transition-all duration-500 ease-in-out`}>
        <div>
          <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-200 dark:border-white/5 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-samp-primary to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-samp-primary/20">
              <Activity className="text-white" size={24} />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">Lakshita Trading Academy</span>
            )}
          </div>

          <div className="px-4 py-6 border-b border-slate-200 dark:border-white/5">
            <div className={`flex items-center gap-3 p-3 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 ${!isSidebarOpen && 'justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-samp-primary/10 flex items-center justify-center text-samp-primary border border-samp-primary/20 flex-shrink-0">
                <User size={18} />
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-slate-900 dark:text-white text-xs font-bold truncate">{currentUser.username}</p>
                  <p className="text-[10px] text-samp-accent uppercase tracking-widest font-mono font-bold">{currentUser.role}</p>
                </div>
              )}
            </div>
          </div>

          <nav className="p-4 space-y-2">
             <NavItem icon={<LineChart size={20} />} label="Terminal" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />
             <NavItem icon={<BookOpen size={20} />} label="Strategy Hub" active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} collapsed={!isSidebarOpen} accent="warning" />
             <NavItem icon={<GraduationCap size={20} />} label="Lakshita Academy" active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} collapsed={!isSidebarOpen} accent="primary" />
             <NavItem icon={<FlaskConical size={20} />} label="Backtesting" active={activeTab === 'backtest'} onClick={() => setActiveTab('backtest')} collapsed={!isSidebarOpen} accent="accent" />
             <NavItem icon={<Code2 size={20} />} label="Quant Lab" active={activeTab === 'strategy'} onClick={() => setActiveTab('strategy')} collapsed={!isSidebarOpen} />
             {currentUser.role === 'ADMIN' && (
               <NavItem icon={<ShieldCheck size={20} />} label="Master Panel" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} accent="warning" collapsed={!isSidebarOpen} />
             )}
             <NavItem icon={<Settings size={20} />} label="API Gateway" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} accent="primary" collapsed={!isSidebarOpen} />
          </nav>
        </div>

        <div className="p-4 space-y-4">
           {isSidebarOpen && (
             <div className="bg-gradient-to-r from-samp-primary/10 to-transparent p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-gray-500">Node Status</h4>
                   <div className="w-1.5 h-1.5 rounded-full bg-samp-success shadow-[0_0_8px_#10b981]"></div>
                </div>
                <p className="text-[11px] text-slate-900 dark:text-white/80 font-mono">BROKER: {brokerConfig.isConnected ? 'LINKED' : 'OFFLINE'}</p>
             </div>
           )}
           <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-gray-500 hover:text-samp-danger transition-colors group ${!isSidebarOpen && 'justify-center'}`}><LogOut size={20} className="group-hover:translate-x-[-2px] transition-transform" />{isSidebarOpen && <span className="font-medium text-sm">Terminate Session</span>}</button>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-2 text-slate-400 dark:text-gray-600 hover:text-slate-900 dark:hover:text-white transition-colors border-t border-slate-200 dark:border-white/5">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-8 bg-white/40 dark:bg-samp-bg/40 backdrop-blur-md z-10 shrink-0">
           <div className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-gray-600 font-mono text-sm">/</span>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                {activeTab === 'dashboard' ? 'Automated Execution Terminal' : 
                 activeTab === 'admin' ? 'Master Strategy Management' : 
                 activeTab === 'settings' ? 'Broker API Gateway' : 
                 activeTab === 'backtest' ? 'Strategy Simulation Engine' : 
                 activeTab === 'hub' ? 'Master Strategy Hub' : 
                 activeTab === 'learn' ? 'Lakshita Academy' : 'Quantitative Strategy Lab'}
              </h2>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2.5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-all">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
              <button className="relative p-2.5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-all"><Bell size={20} /><span className="absolute top-2.5 right-2.5 w-2 h-2 bg-samp-danger rounded-full ring-2 ring-white dark:ring-samp-bg"></span></button>
           </div>
        </header>

        <div className="flex-1 overflow-hidden">
           {activeTab === 'dashboard' && <MarketDashboard strategies={userStrategies} brokerConfig={brokerConfig} userRole={currentUser.role} onRemoveStrategy={removeUserStrategy} />}
           {activeTab === 'strategy' && <AILab />}
           {activeTab === 'admin' && <AdminPanel strategies={masterStrategies} setStrategies={setMasterStrategies} />}
           {activeTab === 'settings' && <SettingsPanel config={brokerConfig} setConfig={setBrokerConfig} />}
           {activeTab === 'backtest' && <BacktestPanel strategies={masterStrategies} />}
           {activeTab === 'hub' && <StrategyHub strategies={masterStrategies} onCopy={copyToUserNamespace} />}
           {activeTab === 'learn' && <LearnPanel />}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; accent?: 'primary' | 'warning' | 'accent'; collapsed: boolean; }> = ({ icon, label, active, onClick, accent = 'primary', collapsed }) => {
  const accentColors = { primary: 'bg-samp-primary shadow-samp-primary/20', warning: 'bg-samp-warning shadow-samp-warning/20', accent: 'bg-samp-accent shadow-samp-accent/20' };
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${active ? `${accentColors[accent]} text-white shadow-xl` : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-gray-300'} ${collapsed && 'justify-center'}`}>
      <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</div>
      {!collapsed && <span className="font-semibold text-sm tracking-wide">{label}</span>}
    </button>
  );
};

export default App;
