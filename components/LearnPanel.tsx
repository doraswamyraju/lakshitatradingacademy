
import React, { useState } from 'react';
import { 
  Play, Video, Users, Clock, Calendar, Search, MonitorPlay, 
  ExternalLink, PlayCircle, Trophy, BarChart3, Bookmark, 
  ChevronRight, Sparkles, Flame, CheckCircle2, BookOpen
} from 'lucide-react';
import { ClassSession } from '../types';

const LearnPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MY_LEARNING'>('EXPLORE');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE' | 'RECORDED'>('ALL');
  const [activeCategory, setActiveCategory] = useState<string>('All Topics');
  const [searchQuery, setSearchQuery] = useState('');

  const sessions: ClassSession[] = [
    {
      id: '1',
      title: 'Advanced Option Greeks Mastery',
      description: 'Understanding Delta, Gamma, Theta, and Vega for professional strategy deployment in volatile markets.',
      type: 'LIVE',
      instructor: 'Dr. Sameer Pathak',
      date: 'Today, 8:30 PM',
      duration: '90 Mins',
      difficulty: 'Advanced',
      category: 'Strategy',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974714658-75d4f1ad308e?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '2',
      title: 'Python for Algorithmic Trading',
      description: 'Step-by-step guide to connecting with Kite Connect API using Lakshita Academy tools and WebSocket streaming.',
      type: 'RECORDED',
      instructor: 'Ankit Sharma',
      date: 'Oct 24, 2024',
      duration: '45 Mins',
      difficulty: 'Beginner',
      category: 'Python',
      progress: 65,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '3',
      title: 'Scalping Strategies in High Volatility',
      description: 'How to use 1-minute timeframes for quick intraday gains during major market news and earnings calls.',
      type: 'RECORDED',
      instructor: 'Dr. Sameer Pathak',
      date: 'Oct 22, 2024',
      duration: '60 Mins',
      difficulty: 'Intermediate',
      category: 'Technical Analysis',
      progress: 100,
      thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '4',
      title: 'Risk Management Frameworks',
      description: 'Setting up institutional grade stop-loss, position sizing models, and trailing mechanisms for large capital.',
      type: 'LIVE',
      instructor: 'Meera Iyer',
      date: 'Tomorrow, 10:00 AM',
      duration: '120 Mins',
      difficulty: 'Intermediate',
      category: 'Psychology',
      thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: '5',
        title: 'Neural Networks in Alpha Mining',
        description: 'Applying LSTM and Transformer models to detect non-linear price patterns in Nifty 50 futures.',
        type: 'RECORDED',
        instructor: 'Dr. Sameer Pathak',
        date: 'Oct 15, 2024',
        duration: '110 Mins',
        difficulty: 'Advanced',
        category: 'Python',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'
      }
  ];

  const categories = ['All Topics', 'Strategy', 'Python', 'Psychology', 'Technical Analysis'];

  const filtered = sessions.filter(s => {
    const matchesFilter = activeFilter === 'ALL' || s.type === activeFilter;
    const matchesCategory = activeCategory === 'All Topics' || s.category === activeCategory;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'EXPLORE' ? true : (s.progress !== undefined && s.progress > 0);
    return matchesFilter && matchesCategory && matchesSearch && matchesTab;
  });

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#050508] overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[1400px] mx-auto p-8 space-y-12 pb-24">
          
          {/* Header & Stats */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <GraduationCap className="text-samp-primary" size={40} />
                Samp Academy
              </h2>
              <p className="text-slate-500 dark:text-gray-400 font-medium">Your gateway to institutional algorithmic excellence.</p>
            </div>

            <div className="flex items-center gap-4">
               <div className="bg-white dark:bg-samp-surface p-4 rounded-3xl border border-slate-200 dark:border-white/5 flex items-center gap-4 shadow-xl">
                  <div className="w-10 h-10 rounded-2xl bg-samp-primary/10 flex items-center justify-center text-samp-primary">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">#124</p>
                  </div>
               </div>
               <div className="bg-white dark:bg-samp-surface p-4 rounded-3xl border border-slate-200 dark:border-white/5 flex items-center gap-4 shadow-xl">
                  <div className="w-10 h-10 rounded-2xl bg-samp-success/10 flex items-center justify-center text-samp-success">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CP Earned</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">1,250</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Featured Hero */}
          <div className="relative rounded-[48px] overflow-hidden bg-[#0A0B14] group shadow-3xl">
             <div className="absolute inset-0">
                <img 
                    src="https://images.unsplash.com/photo-1642790103517-18129f143030?auto=format&fit=crop&q=80&w=1600" 
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" 
                    alt="Featured"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B14] via-[#0A0B14]/80 to-transparent"></div>
             </div>
             <div className="relative z-10 p-12 lg:p-16 max-w-2xl space-y-6">
                <div className="flex items-center gap-3">
                   <span className="px-4 py-1 bg-samp-danger text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      LIVE NOW
                   </span>
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Institutional Series</span>
                </div>
                <h3 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                  High-Frequency <br/> 
                  <span className="text-samp-primary">Alpha Mining</span>
                </h3>
                <p className="text-lg text-white/70 leading-relaxed font-medium">
                  Join our experts as they dissect real-time market microstructure signals using the new Lakshita Academy v4.2 Kernel.
                </p>
                <div className="flex gap-4 pt-4">
                   <button className="px-8 py-4 bg-samp-primary hover:bg-indigo-500 text-white rounded-2xl font-black shadow-2xl shadow-samp-primary/30 flex items-center gap-3 transition-all active:scale-95 group">
                      Enter Lecture Hall <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                   </button>
                   <button className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl border border-white/10 transition-all">
                      <Bookmark size={24} />
                   </button>
                </div>
             </div>
             <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-6 bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                <div className="text-right">
                   <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Connected Quant Attendees</p>
                   <p className="text-2xl font-black text-white">1,429</p>
                </div>
                <div className="flex -space-x-3">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A0B14] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Navigation & Filters */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 w-fit shadow-inner">
                    <button 
                        onClick={() => setActiveTab('EXPLORE')}
                        className={`px-8 py-3 rounded-[20px] text-sm font-black transition-all ${activeTab === 'EXPLORE' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-xl' : 'text-slate-500'}`}
                    >
                        EXPLORE
                    </button>
                    <button 
                        onClick={() => setActiveTab('MY_LEARNING')}
                        className={`px-8 py-3 rounded-[20px] text-sm font-black transition-all ${activeTab === 'MY_LEARNING' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-xl' : 'text-slate-500'}`}
                    >
                        MY LEARNING
                    </button>
                </div>

                <div className="relative w-full md:w-96">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                   <input 
                      type="text" 
                      placeholder="Search for strategies, quants..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] py-4 pl-12 pr-6 text-slate-900 dark:text-white outline-none focus:border-samp-primary shadow-xl transition-all font-medium"
                   />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                  {(['ALL', 'LIVE', 'RECORDED'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all ${activeFilter === f ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}
                    >
                      {f}
                    </button>
                  ))}
               </div>
               <div className="w-px h-6 bg-slate-300 dark:bg-white/10 hidden md:block mx-2"></div>
               <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className={`px-6 py-2 rounded-full text-[11px] font-black border transition-all ${activeCategory === c ? 'bg-samp-primary text-white border-samp-primary shadow-lg shadow-samp-primary/20' : 'bg-transparent text-slate-500 border-slate-300 dark:border-white/10 hover:border-samp-primary/40'}`}
                    >
                      {c}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {filtered.map(session => (
              <div key={session.id} className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[40px] overflow-hidden flex flex-col group hover:border-samp-primary/30 transition-all shadow-2xl relative">
                
                <div className="relative h-60 overflow-hidden">
                  <img src={session.thumbnailUrl} alt={session.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B14] via-transparent to-transparent opacity-80"></div>
                  
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-2xl backdrop-blur-xl ${
                        session.type === 'LIVE' ? 'bg-samp-danger/20 text-samp-danger border-samp-danger/40' : 'bg-samp-primary/20 text-samp-primary border-samp-primary/40'
                     }`}>
                        {session.type === 'LIVE' && <div className="w-1.5 h-1.5 rounded-full bg-samp-danger animate-ping"></div>}
                        {session.type}
                     </span>
                     <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/40 text-white/80 border border-white/10 shadow-2xl backdrop-blur-xl w-fit">
                        {session.difficulty}
                     </span>
                  </div>

                  {session.type === 'RECORDED' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-samp-primary/20 backdrop-blur-md flex items-center justify-center text-white border border-samp-primary/30 shadow-2xl group-hover:scale-110 transition-transform">
                        <Play fill="currentColor" size={24} className="ml-1" />
                      </div>
                    </div>
                  )}

                  {session.progress !== undefined && (
                     <div className="absolute bottom-6 left-6 right-6 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                        <div className="h-full bg-samp-primary" style={{ width: `${session.progress}%` }}></div>
                     </div>
                  )}
                </div>

                <div className="p-8 flex flex-col flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200 dark:border-white/10">
                            <img src={`https://i.pravatar.cc/100?u=${session.instructor}`} alt={session.instructor} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400">{session.instructor}</span>
                    </div>
                    <span className="text-[10px] font-black text-samp-primary uppercase tracking-widest">{session.category}</span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug group-hover:text-samp-primary transition-colors">{session.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-500 leading-relaxed line-clamp-2">{session.description}</p>

                  <div className="pt-6 mt-auto border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                           <Calendar size={12} className="text-samp-primary" />
                           {session.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                           <Clock size={12} className="text-samp-primary" />
                           {session.duration}
                        </div>
                     </div>

                     <button className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 shadow-2xl active:scale-95 ${
                        session.type === 'LIVE' ? 'bg-samp-danger text-white hover:bg-red-500 shadow-samp-danger/20' : 'bg-samp-primary text-white hover:bg-indigo-500 shadow-samp-primary/20'
                     }`}>
                        {session.type === 'LIVE' ? 'JOIN NOW' : (session.progress === 100 ? 'COMPLETED' : 'CONTINUE')}
                        {session.progress === 100 ? <CheckCircle2 size={14} /> : <PlayCircle size={14}/>}
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Learning Pathway Section */}
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[48px] p-12 shadow-3xl space-y-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-samp-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
             
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <Flame className="text-samp-warning" size={32} />
                      Zero to Alpha Pathway
                   </h3>
                   <p className="text-slate-500 dark:text-gray-400 font-medium">A structured roadmap for absolute beginners to quant professionals.</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Progress</p>
                   <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-samp-primary">42%</span>
                      <div className="w-48 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-samp-primary" style={{ width: '42%' }}></div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: 'Foundations', desc: 'Market dynamics & Order types', status: 'completed' },
                  { step: 2, title: 'Scripting', desc: 'Python for Finance basics', status: 'current' },
                  { step: 3, title: 'Logic Core', desc: 'Mean Reversion & Trend following', status: 'locked' },
                  { step: 4, title: 'The Edge', desc: 'ML & Optimization', status: 'locked' }
                ].map((item, idx) => (
                   <div key={idx} className={`p-8 rounded-[32px] border transition-all ${
                     item.status === 'completed' ? 'bg-samp-primary/5 border-samp-primary/20' : 
                     item.status === 'current' ? 'bg-white dark:bg-black/40 border-samp-primary shadow-xl ring-4 ring-samp-primary/10 scale-105 z-10' : 
                     'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 opacity-50'
                   }`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${
                          item.status === 'completed' ? 'bg-samp-primary text-white' : 
                          item.status === 'current' ? 'bg-samp-primary text-white shadow-lg' : 
                          'bg-slate-200 dark:bg-white/10 text-slate-400'
                        }`}>
                          0{item.step}
                        </div>
                        {item.status === 'completed' && <CheckCircle2 className="text-samp-primary" size={24} />}
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white mb-2">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Floating Join Session (If Live) */}
      <div className="fixed bottom-8 right-8 z-[60] group">
          <button className="bg-samp-primary p-6 rounded-[32px] text-white shadow-3xl shadow-samp-primary/40 flex items-center gap-3 transition-all hover:pr-8 hover:scale-110 active:scale-95 group">
             <div className="relative">
                <Video size={28} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-samp-danger rounded-full border-2 border-samp-primary animate-ping"></div>
             </div>
             <span className="hidden group-hover:block font-black text-sm tracking-tight overflow-hidden whitespace-nowrap animate-in slide-in-from-right-4 duration-300">
                Join Active Lab Session
             </span>
          </button>
      </div>
    </div>
  );
};

const GraduationCap = ({ size, className }: { size: number, className?: string }) => (
    <div className={className} style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    </div>
);

export default LearnPanel;
