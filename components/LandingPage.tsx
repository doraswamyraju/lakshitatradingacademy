import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import RegistrationModal from './RegistrationModal';
import AliceBlueModal from './AliceBlueModal';
import {
  Play, Users, TrendingUp, ShieldCheck,
  ChevronDown, MapPin, Phone,
  Mail, CheckCircle2, ArrowRight,
  Target, GraduationCap, Star, BookOpen, Heart, MonitorPlay,
  Zap, Menu, X, Sparkles, Globe, MessageCircle,
  Clock, LayoutGrid, Layers, Bot, BarChart3, LineChart
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  navigate?: (path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, navigate }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = React.useState(false);
  const [isAliceBlueOpen, setIsAliceBlueOpen] = React.useState(false);
  const [comingSoon, setComingSoon] = React.useState<string | null>(null);
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);
  
  const [contactForm, setContactForm] = React.useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = React.useState(false);
  const [contactSuccess, setContactSuccess] = React.useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        setContactSuccess(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setContactSuccess(false), 5000);
      }
    } catch {
      alert('Failed to send message.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const menuItems = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Demo', href: '#demo' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C15] text-white font-sans overflow-x-hidden selection:bg-green-500/30">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0B0C15]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
               <img src="/LTA Logo.png" alt="LTA Logo" className="w-[120%] h-[120%] object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight leading-none text-white uppercase">Lakshita <span className="text-green-500">Trading</span></span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Academy</span>
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6">
            {menuItems.map((item) => (
              <a key={item.name} href={item.href} className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-green-500 transition-colors">
                {item.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate ? navigate('/login') : window.location.pathname = '/login'} 
              className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors px-4"
            >
              Login
            </button>
            <button onClick={() => setIsEnrollOpen(true)} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-500 transition-all active:scale-95 shadow-lg shadow-green-600/20">
              Book Algo Demo
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#0B0C15] border-b border-white/5 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                {menuItems.map((item) => (
                  <a key={item.name} href={item.href} className="block text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-green-500" onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </a>
                ))}
                <button onClick={() => { setIsEnrollOpen(true); setIsMenuOpen(false); }} className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest mt-4">
                  Book Algo Demo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-green-600/10 blur-[160px] rounded-full pointer-events-none opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none opacity-30"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
            >
              Lakshita <br />
              Trading <br />
              <span className="text-green-500 italic">Academy</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl md:text-2xl font-bold text-green-400 mb-6 tracking-tight"
            >
              Discipline + Automation = Consistent Profits
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-400 text-lg mb-10 max-w-lg leading-relaxed"
            >
              Our advanced algo system trades automatically, without emotions and with high accuracy to help you achieve consistent results.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-12"
            >
              <a 
                href="https://wa.me/919515126201" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-green-600/20"
              >
                <MessageCircle size={24} fill="white" />
                WhatsApp Us
              </a>
              <button
                onClick={() => setIsEnrollOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20"
              >
                Book Algo Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6"
            >
              {[
                { icon: <ShieldCheck size={20} />, text: 'No Emotional Trading' },
                { icon: <Target size={20} />, text: 'High Accuracy Strategy' },
                { icon: <Zap size={20} />, text: 'Risk Management Built-in' },
                { icon: <Globe size={20} />, text: 'Works in Nifty & Bank Nifty' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="text-green-500">{item.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main Trading Visual */}
            <div className="relative z-10 bg-gradient-to-br from-green-500/20 to-blue-600/20 p-1 rounded-[48px] backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden group">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
               <img 
                src="/lakshita-hero.png" 
                alt="Lakshita Trading Academy Dashboard" 
                className="w-full h-auto rounded-[46px] shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700" 
               />
               <div className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automate Your Trades</span>
                  <span className="text-lg font-black text-green-500 uppercase">Maximize Your Profits</span>
               </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-6 bg-[#0B0C15]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">How It <span className="text-green-500">Works</span></h2>
            <div className="w-24 h-1.5 bg-green-500 mx-auto rounded-full"></div>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-10 left-10 right-10 h-0.5 border-t-2 border-dashed border-white/10 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 relative z-10">
              {[
                { step: '1', title: 'Signals Generated', desc: 'Signals are generated after market opens using our advanced strategy.', icon: <BarChart3 size={32} /> },
                { step: '2', title: 'Algo Takes Entry', desc: 'Algo automatically takes entry based on the proven rules and conditions.', icon: <Bot size={32} /> },
                { step: '3', title: 'SL & Target Set', desc: 'Stop Loss and Target are predefined for every trade to manage risk smartly.', icon: <ShieldCheck size={32} /> },
                { step: '4', title: 'Trade Managed', desc: 'Algo manages the trade automatically without any manual intervention.', icon: <LineChart size={32} /> },
                { step: '5', title: 'Auto Exit', desc: 'Trade is closed automatically when target is hit or stop loss is triggered.', icon: <CheckCircle2 size={32} /> }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-[28px] bg-[#151725] border border-white/5 flex items-center justify-center text-green-500 mb-6 group-hover:bg-green-600 group-hover:text-white transition-all duration-500 shadow-xl relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-green-500 text-[#0B0C15] flex items-center justify-center font-black text-sm border-4 border-[#0B0C15]">{item.step}</div>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-black mb-3 group-hover:text-green-500 transition-colors uppercase tracking-tight">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features & Who Can Use */}
      <section id="features" className="py-32 px-6 bg-[#10121D]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
          <div className="bg-[#151725] rounded-[40px] p-10 md:p-16 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 text-white/5 group-hover:text-green-500/10 transition-colors duration-700">
              <Zap size={200} />
            </div>
            <h3 className="text-4xl font-black mb-10 uppercase tracking-tighter">Key <span className="text-green-500">Features</span></h3>
            <div className="grid gap-6">
              {[
                'Fully Automated Trading',
                'High Accuracy Strategy',
                'Built-in Risk Management',
                'Works in Nifty & Bank Nifty',
                'No Emotional Trading',
                'Easy to Use Setup',
                'Saves Time & Reduces Stress',
                'Discipline & Consistency'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-green-500" size={14} />
                  </div>
                  <span className="text-lg font-bold text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsEnrollOpen(true)} className="mt-12 px-10 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-xl shadow-green-600/20">
              Know More
            </button>
          </div>

          <div className="flex flex-col justify-center">
            <h3 className="text-4xl font-black mb-10 uppercase tracking-tighter">Who <span className="text-blue-500">Can Use?</span></h3>
            <div className="grid gap-8">
              {[
                { title: 'Beginners', icon: <Users size={24} />, desc: 'Ready to take the next professional step in trading.' },
                { title: 'Working Professionals', icon: <MapPin size={24} />, desc: 'Seeking passive income without manual monitoring.' },
                { title: 'Busy Traders', icon: <Clock size={24} />, desc: 'Save time and reduce emotional stress from markets.' },
                { title: 'Passive Income Seekers', icon: <BarChart3 size={24} />, desc: 'Grow wealth through disciplined automated trading.' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 p-6 rounded-3xl bg-[#151725] border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-1 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setIsEnrollOpen(true)} className="mt-12 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 self-start">
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-[#0B0C15]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">Pricing & <span className="text-green-500">Plans</span></h2>
            <div className="w-24 h-1.5 bg-green-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Setup Cost */}
            <div className="bg-[#151725] rounded-[40px] p-10 border border-green-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-[#0B0C15] px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">One-Time Payment</div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Setup Cost</h3>
              <div className="mb-6">
                <span className="text-slate-500 line-through text-lg font-bold">₹50,000/-</span>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-4xl font-black text-green-500">₹29,999/-</span>
                  <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-lg text-xs font-black uppercase">40% OFF</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                {['Basic Trading Course', '1 Month Algo Subscription', 'Personal Guidance & Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                    <CheckCircle2 className="text-green-500" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsEnrollOpen(true)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-xl shadow-green-600/20">
                Get This Offer
              </button>
            </div>

            {/* Algo Subscription */}
            <div className="bg-[#151725] rounded-[40px] p-10 border border-blue-500/30 shadow-2xl relative overflow-hidden md:scale-105 z-10">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">Monthly Plan</div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight text-blue-500">Algo Subscription</h3>
              <div className="mb-10 flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><MonitorPlay size={28}/></div>
                 <div>
                    <span className="text-4xl font-black text-white">₹7,500</span>
                    <span className="text-slate-400 font-bold ml-1">/month</span>
                 </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium mb-10">Monthly subscription for our advanced algo system with full automation and live tracking.</p>
              <button onClick={() => setIsEnrollOpen(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
                Subscribe Now
              </button>
            </div>

            {/* Additional Charges */}
            <div className="bg-[#151725] rounded-[40px] p-10 border border-orange-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-500 text-white px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">Additional Charges</div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight text-orange-500">Usage Charges</h3>
              <div className="mb-10">
                  <span className="text-4xl font-black text-white">₹8,500</span>
                  <span className="text-slate-400 font-bold ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-10 text-xs font-bold text-slate-400">
                {['Platform Charges', 'Transaction Charges', 'API Charges', 'Cloud / Server Charges', 'Strategy Maintenance', 'Data Subscription Charges'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="text-orange-500" size={14} />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsEnrollOpen(true)} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20">
                Know More
              </button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#10121D] p-8 rounded-[32px] border border-white/5">
              {[
                { icon: <LineChart className="text-green-500"/>, title: 'Backtested Results', desc: 'Available for Review' },
                { icon: <Zap className="text-blue-500"/>, title: 'Live Performance', desc: 'Proof Provided' },
                { icon: <Clock className="text-orange-500"/>, title: 'Regular Updates', desc: 'Strategy Maintenance' },
                { icon: <ShieldCheck className="text-green-500"/>, title: 'Dedicated Support', desc: '& Expert Guidance' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <div className="mb-2">{item.icon}</div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{item.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500">{item.desc}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Bonus Section */}
      <section className="py-24 px-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-green-500/5 backdrop-blur-3xl"></div>
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="bg-[#0B0C15] rounded-[48px] border-4 border-yellow-500/20 p-12 overflow-hidden relative group">
                <div className="absolute top-0 left-0 bg-red-600 text-white px-10 py-3 rounded-br-3xl font-black uppercase tracking-widest shadow-2xl z-20">Special Discount</div>
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-4 p-8 bg-[#151725] rounded-[40px] border border-white/5 shadow-2xl relative">
                        <div className="text-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Algo Setup Worth</span>
                            <div className="relative inline-block mb-4">
                                <span className="text-4xl font-black text-slate-600 line-through">₹50,000/-</span>
                                <div className="absolute -top-4 -right-16 bg-red-600 text-white px-4 py-2 rounded-xl text-xl font-black rotate-12 shadow-xl">40% OFF</div>
                            </div>
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] mb-4 block">Special Offer Price</span>
                            <h4 className="text-6xl font-black text-white mb-6 tracking-tighter">₹29,999/-</h4>
                            <div className="w-full h-px bg-white/5 mb-6"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">One Time Payment • No Hidden Charges</span>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-0.5 flex-1 bg-yellow-500/30"></div>
                            <h3 className="text-3xl md:text-5xl font-black text-yellow-500 uppercase tracking-tighter flex items-center gap-4">
                                <Star size={40} fill="currentColor"/>
                                Bonus &mdash; Total Worth ₹24,948/-
                                <Star size={40} fill="currentColor"/>
                            </h3>
                            <div className="h-0.5 flex-1 bg-yellow-500/30"></div>
                        </div>

                        <div className="grid gap-6 mb-10">
                            {[
                                { title: 'Basic Course', value: '₹19,999/-', desc: 'Learn Strategy, Risk Management, Trading Psychology & More', tag: 'FREE' },
                                { title: 'Personal Guidance', value: '₹1,999/-', desc: 'One-to-One Support & Personal Guidance (Per Month)', tag: 'FREE' },
                                { title: 'Algo First Month Maintenance', value: '₹7,500/-', desc: 'Algo Maintenance Charges (First Month)', tag: 'FREE' }
                            ].map((item, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-md rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5 hover:border-yellow-500/20 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
                                            {i === 0 ? <GraduationCap size={32}/> : i === 1 ? <Users size={32}/> : <Zap size={32}/>}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tight">{item.title}</h4>
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Worth</span>
                                            <span className="text-xl font-black text-white">{item.value}</span>
                                        </div>
                                        <div className="px-6 py-2 bg-green-500 text-[#0B0C15] rounded-xl font-black text-lg tracking-widest shadow-lg shadow-green-500/20">
                                            {item.tag}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-yellow-500 p-4 rounded-2xl text-[#0B0C15] text-center">
                            <h5 className="text-2xl font-black uppercase tracking-tighter">Total Bonus Worth ₹24,948/-</h5>
                            <p className="text-sm font-bold uppercase tracking-widest">You pay only ₹29,999/- & Get benefits worth ₹24,948/- Absolutely Free!</p>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Algo Demo Section */}
      <section id="demo" className="py-32 px-6 bg-[#10121D]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6 block">Experience Before You Invest</span>
              <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">Algo Demo &mdash; <br/><span className="text-blue-500">Live Session</span></h2>
              <p className="text-xl font-bold text-slate-400 mb-8">One-Day Live Demo</p>
              
              <div className="flex items-center gap-8 mb-10">
                 <div className="text-6xl font-black text-white">₹499<span className="text-2xl font-bold text-slate-500 ml-1">/-</span></div>
                 <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400">Only</div>
              </div>

              <div className="space-y-6 mb-12">
                 <p className="text-lg text-slate-400 flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={24}/>
                    See Live Trading | Understand The Strategy
                 </p>
                 <p className="text-lg text-slate-400 flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={24}/>
                    Clear Your Doubts with Expert Mentors
                 </p>
              </div>

              <button onClick={() => setIsEnrollOpen(true)} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-4">
                 <Clock size={24}/>
                 Book Your Demo Now
              </button>
            </div>

            <div className="bg-[#151725] rounded-[48px] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-500"></div>
               <h3 className="text-3xl font-black text-center mb-10 uppercase tracking-tighter">Book Algo Demo</h3>
               <form className="grid grid-cols-2 gap-6" onSubmit={handleContactSubmit}>
                  <div className="col-span-1">
                     <input type="text" placeholder="Your Name" className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white outline-none focus:border-green-500 transition-all font-bold" required />
                  </div>
                  <div className="col-span-1">
                     <input type="number" placeholder="Your Age" className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white outline-none focus:border-green-500 transition-all font-bold" required />
                  </div>
                  <div className="col-span-1">
                     <input type="text" placeholder="Your Location" className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white outline-none focus:border-green-500 transition-all font-bold" required />
                  </div>
                  <div className="col-span-1">
                     <select className="w-full bg-[#1A1C2E] border border-white/5 rounded-xl py-4 px-6 text-slate-400 outline-none focus:border-green-500 transition-all font-bold" required>
                        <option value="">Market Experience</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                     </select>
                  </div>
                  <div className="col-span-2">
                     <input type="tel" placeholder="Contact Number" className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-6 text-white outline-none focus:border-green-500 transition-all font-bold" required />
                  </div>
                  <div className="col-span-2 mt-4">
                     <button type="submit" className="w-full py-5 bg-green-600 text-[#0B0C15] rounded-2xl font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-xl shadow-green-600/20 text-lg">
                        Book Now &mdash; ₹499 Only
                     </button>
                     <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                        <ShieldCheck size={14}/>
                        Your details are safe with us.
                     </p>
                  </div>
               </form>
            </div>
          </div>
        </div>
      </section>

      {/* About Founder Section - Preserved & Re-styled */}
      <section id="about" className="py-32 px-6 bg-[#0B0C15] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <Star className="text-blue-500" size={16} />
              <span className="text-[10px] font-black tracking-widest uppercase text-blue-500">Founder & Head Mentor</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter leading-none text-white">K. Y. <span className="text-blue-500">Sampangi</span></h2>
            <p className="text-2xl font-black text-slate-400 mb-8 leading-tight italic">"Empowering retail traders with institutional-grade discipline and automation."</p>
            
            <div className="grid grid-cols-2 gap-8 mb-12">
               <div className="p-6 bg-white/5 rounded-[32px] border border-white/5">
                  <h4 className="text-5xl font-black text-blue-500 mb-2">5+</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Years of Real Market Experience</p>
               </div>
               <div className="p-6 bg-white/5 rounded-[32px] border border-white/5">
                  <h4 className="text-5xl font-black text-green-500 mb-2">15k+</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Students Mentored Nationwide</p>
               </div>
            </div>

            <div className="space-y-4">
              {[
                'Professional Trader & Expert Market Analyst',
                'Pioneer of Algorithmic Trading Systems in Telugu',
                'Focus on Emotional Control & Risk Management'
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-lg font-bold text-slate-300">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-[60px] blur-3xl transform rotate-12 -z-10 group-hover:rotate-0 transition-transform duration-700"></div>
                <div className="relative z-10 rounded-[60px] overflow-hidden border-[12px] border-[#151725] shadow-2xl aspect-[4/5] bg-gradient-to-br from-[#151725] to-[#0B0C15]">
                  <img
                    src="/founder.png"
                    alt="Founder Sampangi"
                    className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-1000 transform hover:scale-[1.05]"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-[#0B0C15] to-transparent">
                    <h3 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Sampangi</h3>
                    <p className="text-blue-500 text-lg font-black uppercase tracking-widest">Lakshita Trading Academy</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 bg-[#10121D]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">Expert <span className="text-green-500">Answers</span></h2>
            <div className="w-24 h-1.5 bg-green-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid gap-4">
            {[
              { q: "Is this algo system suitable for beginners?", a: "Yes! Our system is designed for both beginners and busy professionals. We provide a full setup and the initial basic course as a bonus to ensure you understand how it works." },
              { q: "What is the accuracy of the Lakshita Algo?", a: "The system is based on high-probability institutional setups including Heikinashi and DMI. While no system is 100%, we focus on consistent profitability through robust risk management." },
              { q: "Do I need to stay online during market hours?", a: "No. The system is fully automated and runs on a secure cloud server. You can monitor performance from your phone, but manual entry/exit is not required." },
              { q: "Which brokers are supported?", a: "We currently have seamless integration with Alice Blue. Other major brokers like Upstox, Angel One, and Fyers will be added soon." },
              { q: "Is there any hidden cost?", a: "All costs are clearly mentioned in our pricing table. The one-time setup covers your initial configuration, and the monthly subscription covers ongoing system usage." }
            ].map((faq, i) => (
              <div 
                key={i} 
                className={`group transition-all duration-500 rounded-[32px] overflow-hidden ${activeFaq === i ? 'bg-[#151725] border border-green-500/20' : 'bg-[#151725]/50 border border-white/5 hover:border-white/10'}`}
              >
                <button 
                  className="w-full px-8 py-6 text-left flex justify-between items-center"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <span className={`text-lg font-black transition-colors ${activeFaq === i ? 'text-green-500' : 'text-slate-300'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeFaq === i ? 'bg-green-500 text-[#0B0C15] rotate-180' : 'bg-white/5 text-slate-500'}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "circOut" }}
                    >
                      <div className="px-8 pb-8 text-slate-400 leading-relaxed font-medium">
                        <div className="h-px bg-white/5 mb-6"></div>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-green-600 to-blue-700 rounded-[60px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-green-600/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-5xl md:text-8xl font-black mb-8 text-white uppercase tracking-tighter leading-none">Start Your Algo <br/>Journey Today!</h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-bold tracking-tight">
              Let automation and discipline take your trading to the next level. Limited slots available for new setup integrations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <a 
                href="https://wa.me/919515126201" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-12 py-5 bg-[#0B0C15] text-[#25D366] rounded-[32px] font-black text-xl uppercase tracking-widest hover:bg-[#151725] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl"
               >
                 <MessageCircle size={28} fill="#25D366" />
                 WhatsApp Us
               </a>
               <button onClick={() => setIsEnrollOpen(true)} className="w-full sm:w-auto px-12 py-5 bg-white text-blue-700 rounded-[32px] font-black text-xl uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl">
                 <Phone size={28} />
                 Call Now
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0C15] pt-32 pb-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <a href="/" className="flex items-center gap-4 mb-8 group">
                <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
                   <img src="/LTA Logo.png" alt="LTA Logo" className="w-[120%] h-[120%] object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-2xl tracking-tight text-white uppercase leading-none">Lakshita <span className="text-green-500">Trading</span></span>
                  <span className="text-[11px] font-bold tracking-[0.3em] text-slate-500 uppercase">Academy</span>
                </div>
              </a>
              <p className="text-slate-500 max-w-md leading-relaxed font-medium mb-8">
                Our mission is to provide smart, automated trading solutions with discipline, transparency and trust. Founded by Sampangi, serving traders nationwide.
              </p>
              <div className="flex items-center gap-6">
                 <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><Globe size={20}/></a>
                 <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#25D366] hover:text-white transition-all"><MessageCircle size={20}/></a>
                 <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-all"><BarChart3 size={20}/></a>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-10">Quick Links</h4>
              <ul className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-bold text-slate-500">
                {menuItems.map(item => (
                  <li key={item.name}><a href={item.href} className="hover:text-green-500 transition-colors">{item.name}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-10">Disclaimer</h4>
              <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                Stock market investments are subject to market risks. We are not SEBI registered. Please use this system at your own risk. Results may vary based on market conditions. Proper risk management is advised.
              </p>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">© 2024 Lakshita Trading Academy. All Rights Reserved.</p>
            <div className="flex items-center gap-8">
               <a href="#" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Terms & Conditions</a>
               <a href="#" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <RegistrationModal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} />
      <AliceBlueModal isOpen={isAliceBlueOpen} onClose={() => setIsAliceBlueOpen(false)} />
    </div>
  );
};

export default LandingPage;
