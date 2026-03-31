import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import RegistrationModal from './RegistrationModal';
import AliceBlueModal from './AliceBlueModal';
import FloatingButtons from './FloatingButtons';
import {
  Play, Users, TrendingUp, ShieldCheck,
  ChevronDown, ChevronUp, MapPin, Phone,
  Mail, Instagram, Facebook, Twitter,
  CheckCircle2, ArrowRight, BarChart, FlaskConical,
  Target, GraduationCap, Star, BookOpen, Heart, MonitorPlay,
  Zap, Menu, X, Sparkles, Globe, MessageCircle
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
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

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden selection:bg-blue-100">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
               <img src="/LTA Logo.png" alt="LTA Logo" className="w-[120%] h-[120%] object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight text-blue-900">Lakshita Trading Academy</span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#courses" className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors">Courses</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors">About Sampangi</a>
            <a href="#why-us" className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors">Why Us</a>
            <a href="#brokers" className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors">Brokers</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-bold text-slate-900 hover:text-blue-900 transition-colors">
              Student Portal
            </button>
            <button onClick={() => setIsEnrollOpen(true)} className="px-6 py-2.5 bg-blue-900 text-white rounded-full text-sm font-bold hover:bg-blue-800 transition-all active:scale-95">
              Enroll Now
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-blue-900">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-6 space-y-4 animate-in slide-in-from-top-4">
            <a href="#courses" className="block text-lg font-medium text-slate-600 hover:text-blue-900" onClick={() => setIsMenuOpen(false)}>Courses</a>
            <a href="#about" className="block text-lg font-medium text-slate-600 hover:text-blue-900" onClick={() => setIsMenuOpen(false)}>About Sampangi</a>
            <a href="#why-us" className="block text-lg font-medium text-slate-600 hover:text-blue-900" onClick={() => setIsMenuOpen(false)}>Why Us</a>
            <button onClick={onLogin} className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold mt-4">
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Unique Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-blue-600/5 blur-[160px] rounded-full pointer-events-none opacity-50"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8"
            >
              <Sparkles className="text-blue-600" size={16} />
              <span className="text-xs font-bold tracking-widest uppercase text-blue-900/60">Practical Stock Market Training</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-8 text-blue-950"
            >
              Become a <br />
              <span className="text-blue-700">Confident</span> and <br />
              <span className="text-blue-700">Consistent</span> Trader
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3 mb-10"
            >
              {[
                { icon: <Target size={16} className="text-blue-600 shrink-0 mt-0.5" />, text: 'Practical Stock Market Training for Serious Traders' },
                { icon: <MonitorPlay size={16} className="text-blue-600 shrink-0 mt-0.5" />, text: 'Offline & Online Classes — Limited Seats Only' },
                { icon: <Zap size={16} className="text-blue-600 shrink-0 mt-0.5" />, text: <span>Learn <span className="text-slate-400 font-light">·</span> Practice <span className="text-slate-400 font-light">·</span> Execute <span className="text-slate-400 font-light">·</span> Succeed</span> }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <span className="text-slate-700 font-medium">{item.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={() => setIsEnrollOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                Enroll Now Today
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4 px-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Student" />
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-500">
                  <span className="text-blue-900 font-bold">15k+</span> Students
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 flex items-center gap-2 text-slate-500 text-sm"
            >
              <Phone size={15} className="text-green-600" />
              <span>Call or WhatsApp: <a href="tel:+919515126201" className="font-bold text-blue-900 hover:underline">+91 9515126201</a></span>
            </motion.div>
          </div>

          {/* Unique Founder Image Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[60px] overflow-hidden border-[12px] border-white shadow-2xl aspect-[4/5] bg-blue-50">
              <img
                src="/founder.png"
                alt="Founder Sampangi"
                className="w-full h-full object-contain transition-all duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-blue-950/90 to-transparent">
                <h3 className="text-2xl font-bold text-white">Sampangi</h3>
                <p className="text-blue-200 text-sm font-medium">Founder & Head Mentor</p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-900/10 rounded-full blur-3xl animate-pulse-slow"></div>

            {/* Floating Stats Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/4 -right-8 z-20 bg-white p-4 rounded-2xl shadow-xl border border-blue-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Success Rate</p>
                  <p className="text-lg font-black text-blue-900">94.8%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-1/4 -left-8 z-20 bg-white p-4 rounded-2xl shadow-xl border border-blue-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Community</p>
                  <p className="text-lg font-black text-blue-900">Active 24/7</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Academy Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <GraduationCap className="text-blue-600" size={16} />
              <span className="text-xs font-bold tracking-widest uppercase text-blue-900/60">About Lakshita Trading Academy</span>
            </div>
            <h2 className="text-4xl font-black mb-6 text-blue-950">A Professional Stock Market Training Institute</h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              Based in Tirupati, we offer both online and offline programs. We don't teach theory alone&mdash;we train you for real market conditions.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'Practical Learning, Live Market Understanding, Discipline & Risk Management.',
                'Transforming existing traders into confident and consistent market participants.'
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="text-blue-700" size={18} />
                  </div>
                  <span className="font-medium text-slate-700 leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-900 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-50"></div>
            <Target size={48} className="text-blue-400 mb-8" />
            <h3 className="text-3xl font-black mb-4">Our Mission</h3>
            <p className="text-xl text-blue-100 leading-relaxed font-medium">
              To create disciplined Traders who understand risk before profit and consistency before excitement.
            </p>
          </div>
        </div>
      </section>

      {/* About Founder Section */}
      <section id="about" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
              <Star className="text-blue-700" size={16} />
              <span className="text-xs font-bold tracking-widest uppercase text-blue-900/80">About the Trainer</span>
            </div>
            <h2 className="text-4xl font-black mb-4 text-blue-950">K. Y. Sampangi</h2>
            <p className="text-lg font-bold text-blue-700 mb-6">Founder &mdash; Lakshita Trading Academy<br/><span className="text-slate-500 font-medium tracking-wide text-sm uppercase mt-1 inline-block">Profit Trader | Mentor | Market Analyst</span></p>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              With practical market experience and a disciplined approach, he focuses on building confident and emotionally strong traders.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-white" size={14} />
                </div>
                <span className="font-medium text-slate-700">Practical Market Experience</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-white" size={14} />
                </div>
                <span className="font-medium text-slate-700">Disciplined Trading Approach</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-white" size={14} />
                </div>
                <span className="font-medium text-slate-700">Focus on Emotional Strength</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img src="/1a.jpg" className="rounded-3xl shadow-lg w-full h-[300px] object-cover" alt="Trading Analysis" />
              <div className="bg-blue-900 p-8 rounded-3xl text-white">
                <h4 className="text-4xl font-black mb-2">5+</h4>
                <p className="text-blue-200 text-sm">Years Experience</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200">
                <h4 className="text-4xl font-black mb-2 text-blue-900">100+</h4>
                <p className="text-slate-500 text-sm">Live Sessions</p>
              </div>
              <img src="/1b.jpg" className="rounded-3xl shadow-lg w-full h-[300px] object-cover" alt="Founder Trading Room" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-blue-950">Why Choose Lakshita Trading Academy?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We provide a unique learning environment designed for your success.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <GraduationCap size={32} />, title: 'From Zero to Teaching', desc: 'Complete guidance from the absolute basics up to an advanced teaching level.' },
              { icon: <Heart size={32} />, title: 'Practical Psychology & Discipline', desc: 'Master your emotions and build the mental framework required for trading.' },
              { icon: <MonitorPlay size={32} />, title: 'Live Market Analysis Sessions', desc: 'Learn to analyze and trade in real-time during live market sessions.' },
              { icon: <Users size={32} />, title: 'Limited Batch — Personal Attention', desc: 'We limit our batch sizes to ensure every student gets individual focus.' },
              { icon: <BookOpen size={32} />, title: 'Step-by-Step Structured Learning', desc: 'A clear, organized curriculum that builds your knowledge systematically.' },
              { icon: <ShieldCheck size={32} />, title: 'Focus on Risk Management', desc: 'Protect your capital with robust risk management techniques.' }
            ].map((item, idx) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }} key={idx} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 transition-all shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 text-blue-600">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-blue-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Highlights & Who Can Join */}
      <section id="courses" className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-blue-950">Comprehensive Training Programs</h2>
            <p className="text-slate-600 font-medium">Heikinashi + ADX/DMI + Bollinger Band &mdash; Our Signature Setup</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Basic Course Card */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-xl hover:border-blue-300 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-blue-900 mb-1">Basic Trading Course</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Perfect for Beginners & New Traders</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-xs font-bold">15 Days + 1 Month Practice</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-8">
                {[
                  "Introduction to Stock Market", "What is SEBI? Role of SEBI", "NSE & BSE Understanding",
                  "Demat & Trading Account", "Market Behaviour", "Candles Clear Information",
                  "Types of Orders (Market, Limit, SL)", "LTA Setup (Intraday)", "Basic Risk Management",
                  "Capital Protection Rules", "Trading Discipline Intro", "Paper Trade",
                  "Back Test", "Live Market (Orders)", "Emotional Control TIPS"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                    <span>{i + 1}. {item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Special Fee</span>
                  <span className="text-3xl font-black text-blue-900">₹9,999</span>
                  <span className="text-sm text-slate-400 line-through ml-2">₹19,999</span>
                </div>
                <button onClick={() => setIsEnrollOpen(true)} className="px-6 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all">Enroll Now</button>
              </div>
            </div>

            {/* Advance Course Card */}
            <div className="bg-white rounded-[40px] p-8 border border-blue-200 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-900 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-blue-900 mb-1">Advance Training Course</h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">For Existing Traders Seeking Consistency</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-xs font-bold">30 Days + 2 Months Practice</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-8">
                {[
                  "Price Action", "Understanding Market", "Support and Resistance",
                  "Moving Averages", "Option Greeks", "Trendline", "CPR",
                  "Main Setup 9/15 (Scalping)", "Main Setup 9/20", "BTST",
                  "Gap Up / Gap Down", "Risk Management", "Back Test",
                  "Live Market Explanation", "Psychology & Emotional Control"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                    <span>{i + 1}. {item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Special Fee</span>
                  <span className="text-3xl font-black text-blue-900">₹19,999</span>
                  <span className="text-sm text-slate-400 line-through ml-2">₹39,999</span>
                </div>
                <button onClick={() => setIsEnrollOpen(true)} className="px-6 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all">Enroll Now</button>
              </div>
            </div>
          </div>

          {/* Who Can Join & Monthly Subscription */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm col-span-1">
              <h3 className="text-xl font-black text-blue-950 mb-6 flex items-center gap-2">
                <Users className="text-blue-600" size={24} /> Who Can Join?
              </h3>
              <ul className="space-y-4">
                {[
                  { title: "Existing Traders", desc: "Refine strategies and discipline." },
                  { title: "Beginners", desc: "Ready to take the next professional step." },
                  { title: "Working Professionals", desc: "Seeking secondary income." },
                  { title: "Business Owners", desc: "Wealth growth through markets." },
                  { title: "Housewives", desc: "For financial independence." }
                ].map((person, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <ArrowRight className="text-blue-700 mt-1 shrink-0" size={14} />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{person.title}</h4>
                      <p className="text-xs text-slate-500">{person.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-900 rounded-[40px] p-8 text-white col-span-2 relative overflow-hidden shadow-2xl">
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-30"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <Star className="text-yellow-400" size={24} /> Monthly Subscription Plans
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { period: "1 Month", price: "₹1,999", tag: "Basic" },
                    { period: "3 Months", price: "₹3,999", tag: "Popular", highlight: true },
                    { period: "6 Months", price: "₹6,999", tag: "Best Value" }
                  ].map((plan, i) => (
                    <div key={i} className={`p-6 rounded-3xl border ${plan.highlight ? 'bg-white text-blue-900 border-white' : 'bg-blue-950/40 border-blue-800/50 text-white'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{plan.tag}</p>
                      <h4 className="text-xl font-black mb-2">{plan.period}</h4>
                      <p className="text-2xl font-black">{plan.price}</p>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400" /> Weekend Doubt Sessions</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400" /> After Market Daily Updates</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400" /> 1-1 Personal Guidance</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400" /> Weekly Back Test & Paper Trade</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Broker Partners Section */}
      <section id="brokers" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4 text-blue-950">Our Trusted Broker Partners</h2>
            <p className="text-slate-600">Open your free Demat account and get exclusive benefits.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Alice Blue',
                benefits: ['Free Demat Account', 'Zero Delivery Charges', 'Personal Support'],
                color: 'bg-blue-50',
                textColor: 'text-blue-900',
                link: 'ALICEBLUE'
              },
              {
                name: 'Upstox',
                benefits: ['Free AMC for 1 Year', 'User-Friendly Interface', 'SEBI Registered'],
                color: 'bg-purple-50',
                textColor: 'text-purple-900'
              },
              {
                name: 'Angel One',
                benefits: ['Free AMC for 2 Years', 'Fast Fund Settlements', 'Multi-language Support'],
                color: 'bg-orange-50',
                textColor: 'text-orange-900'
              },
              {
                name: 'Fyers',
                benefits: ['Lifetime Free AMC', 'Advanced Trading View', '24/7 Support'],
                color: 'bg-green-50',
                textColor: 'text-green-900'
              }
            ].map((broker, idx) => (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -8 }} key={idx} className={`p-6 rounded-3xl ${broker.color} border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between`}>
                <div>
                   <h3 className={`text-xl font-black mb-4 ${broker.textColor}`}>{broker.name}</h3>
                   <ul className="space-y-2 mb-6">
                     {broker.benefits.map((b, i) => (
                       <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600/80">
                         <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                         {b}
                       </li>
                     ))}
                   </ul>
                </div>
                <button 
                    onClick={() => {
                        if (broker.name === 'Alice Blue') setIsAliceBlueOpen(true);
                        else {
                           setComingSoon(broker.name);
                           setTimeout(() => setComingSoon(null), 3000);
                        }
                    }}
                    className="w-full py-2.5 bg-white rounded-xl font-bold text-sm text-slate-900 shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  Open Account
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-32 px-6 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-50/50 blur-[120px] rounded-full pointer-events-none -ml-48 -mb-48"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">Support Center</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-blue-950">Expert Answers</h2>
            <p className="text-slate-500 font-medium">Everything you need to know about our trading programs.</p>
          </div>

          <div className="grid gap-4">
            {[
              { q: "Is this course suitable for complete beginners?", a: "Yes! Our Basic Trading Course is specifically designed to take you from zero understanding to a professional level with 15 days of intensive theory and 1 month of practice." },
              { q: "In which language are the classes conducted?", a: "We teach exclusively in Telugu to ensure maximum clarity and comfort for our students from Andhra Pradesh and Telangana." },
              { q: "Do you provide live market support?", a: "Absolutely. We conduct live trading sessions where you can see the strategies being applied in real-time. We also have daily doubt clarification sessions." },
              { q: "What is the specialized LTA setup?", a: "Our signature setup combines Heikinashi candles with ADX/DMI and Bollinger Bands for high-probability intraday and scalping opportunities." },
              { q: "How long until I become a profitable trader?", a: "While this varies, our structured 30-day Advanced program combined with 2 months of mandatory practice is designed to instill the discipline required for consistency." },
              { q: "Do you offer offline classes in Tirupati?", a: "Yes, we have a physical training center in Daminedu, Tirupati, for those who prefer face-to-face mentoring and a classroom environment." }
            ].map((faq, i) => (
              <motion.div 
                key={i} 
                initial={false}
                className={`group border-2 transition-all duration-500 rounded-[32px] overflow-hidden ${activeFaq === i ? 'bg-white border-blue-200 shadow-xl' : 'bg-slate-100/50 border-transparent hover:border-slate-200'}`}
              >
                <button 
                  className="w-full px-8 py-6 text-left flex justify-between items-center"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <span className={`text-lg font-black transition-colors ${activeFaq === i ? 'text-blue-900' : 'text-slate-700'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeFaq === i ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-200 text-slate-500'}`}>
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
                      <div className="px-8 pb-8 text-slate-600 leading-relaxed font-medium">
                        <div className="h-px bg-slate-100 mb-6"></div>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Our Process Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-blue-950">Our Trading Process</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">A systematic approach to help you become an independent trader.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Learn the Basics', desc: 'Understand how the market works from scratch.' },
              { step: '02', title: 'Master Strategy', desc: 'Learn institutional price action and advanced concepts.' },
              { step: '03', title: 'Live Practice', desc: 'Trade in live markets under our expert guidance.' },
              { step: '04', title: 'Profit Consistently', desc: 'Apply risk management to achieve consistent returns.' }
            ].map((s, idx) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.05 }} key={idx} className="relative p-8 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col items-center text-center hover:shadow-lg transition-all">
                <div className="w-16 h-16 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-2xl mb-6 shadow-lg shadow-blue-900/20">{s.step}</div>
                <h3 className="text-xl font-bold mb-3 text-blue-900">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                {idx < 3 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-blue-200"></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-blue-950">Success Stories</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Hear from our students who transformed their trading journey.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Ramesh P.", course: "Full Stock Market Course", text: "Joining Lakshita Academy was the best decision. The way Sampangi explains complex concepts in Telugu is outstanding." },
              { name: "Suresh K.", course: "Advanced Technicals", text: "I struggled with risk management for years. The institutional concepts taught here transformed my approach completely." },
              { name: "Lakshmi M.", course: "Options Specialization", text: "Sampangi's options buying strategies are a game changer! I am finally trading profitably and understand the market deeply." }
            ].map((testimonial, i) => (
              <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }} key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-shadow relative pt-12">
                <div className="absolute -top-6 left-8">
                  <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="Student" className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-white" />
                </div>
                <div className="flex gap-1 mb-4 text-yellow-400">
                  <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                </div>
                <p className="text-slate-600 italic mb-6">"{testimonial.text}"</p>
                <div>
                  <h4 className="font-bold text-blue-950">{testimonial.name}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mt-1">{testimonial.course}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 p-12 lg:p-16 bg-blue-900 text-white flex flex-col justify-center">
            <h2 className="text-4xl font-black mb-6">Get In Touch</h2>
            <p className="text-blue-200 mb-10 text-lg leading-relaxed">Have questions about our courses? Reach out to our team, and we'll be happy to help you.</p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={24} className="text-blue-300" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Office Location</h4>
                  <p className="text-blue-200 text-sm leading-relaxed">Door no 9-84/15, Advaita Nagar,<br />Near collector office, Daminedu, Tirupati pin 517503</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={24} className="text-blue-300" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Phone & WhatsApp</h4>
                  <p className="text-blue-200 text-sm">+91 9515126201</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={24} className="text-blue-300" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Email Address</h4>
                  <p className="text-blue-200 text-sm">info@lakshitaacademy.in</p>
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 p-12 lg:p-16">
            <h3 className="text-2xl font-black mb-8 text-blue-950">Send us a Message</h3>
            {contactSuccess ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-3xl border border-green-100">
                <CheckCircle2 size={48} className="text-green-500 mb-4" />
                <h4 className="text-2xl font-black text-green-900 mb-2">Message Sent!</h4>
                <p className="text-green-700">Thanks for reaching out. We will get back to you shortly.</p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleContactSubmit}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                  <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input type="email" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                  <input type="tel" required value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="+91 9999999999" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                  <textarea required rows={4} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" disabled={isSubmittingContact} className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmittingContact ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900 to-blue-950 rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="inline-block px-6 py-2 bg-red-500 text-white font-bold rounded-full text-sm uppercase tracking-widest mb-6 animate-pulse">
              Limited Seats Available
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">Join Our Offline Batch Now</h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              We accept only serious and committed traders. Personal attention is our priority because your success is our success.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button onClick={() => setIsEnrollOpen(true)} className="px-10 py-5 bg-white text-blue-900 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-xl flex items-center gap-3 w-full sm:w-auto justify-center">
                Enroll Now
              </button>
              <a href="https://wa.me/919515126201" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-blue-900/40 text-white border border-blue-400/30 rounded-2xl font-black text-lg hover:bg-blue-900/60 transition-all active:scale-95 shadow-xl flex items-center gap-3 w-full sm:w-auto justify-center">
                <Phone size={24} />
                WhatsApp: 9515126201
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/80 bg-blue-900/50 inline-flex px-6 py-3 rounded-full border border-blue-800">
              <MapPin size={20} className="text-red-400" />
              <span className="font-medium text-lg">Location: Tirupati</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <a href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                   <img src="/LTA Logo.png" alt="LTA Logo" className="w-[120%] h-[120%] object-contain" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Lakshita Trading Academy</span>
              </a>
              <p className="text-blue-200/60 max-w-sm leading-relaxed">
                Empowering retail traders with institutional-grade education in Telugu. Founded by Sampangi.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Courses</h4>
              <ul className="space-y-4 text-sm text-blue-200/60">
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Full Market Course</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Advanced Technicals</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Options Specialization</a></li>
                <li><button onClick={() => setIsEnrollOpen(true)} className="hover:text-white hover:translate-x-1 inline-block transition-transform">Free Demo Class</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-blue-200/60">
                <li><a href="#contact" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Contact Us</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Terms of Use</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">SEBI Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-2xl">
              <h5 className="text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-400"/> Disclaimer</h5>
              <ul className="text-xs text-blue-200/50 space-y-2 list-disc list-inside">
                <li>Stock market trading involves financial risk.</li>
                <li>Lakshita Trading Academy provides educational training only.</li>
                <li>We do not provide any calls/tips, investment advice, or guarantee profit.</li>
                <li>Participants must consult a registered financial advisor before making investment decisions.</li>
              </ul>
              <div className="mt-8">
                <p className="text-sm text-blue-200/40">© 2024 Lakshita Trading Academy. All rights reserved.</p>
                <p className="text-sm text-blue-200/40 mt-1">Built with love by <a href="https://www.rajugariventures.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white underline transition-colors">Rajugari Ventures</a></p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-blue-200/40 hover:text-white hover:scale-110 transition-all"><Globe size={24} /></a>
              <a href="#" className="text-blue-200/40 hover:text-[#25D366] hover:scale-110 transition-all"><MessageCircle size={24} /></a>
            </div>
          </div>
        </div>
      </footer>
      <RegistrationModal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} />
      <AliceBlueModal isOpen={isAliceBlueOpen} onClose={() => setIsAliceBlueOpen(false)} />

      <AnimatePresence>
        {comingSoon && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4"
          >
            <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Zap className="text-samp-primary animate-pulse" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">{comingSoon} Integration</h4>
                <p className="text-slate-400 text-sm">Feature coming soon! Currently accepting Alice Blue partners.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;

