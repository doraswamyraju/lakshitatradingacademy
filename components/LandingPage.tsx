import React from 'react';
import { motion } from 'motion/react';
import RegistrationModal from './RegistrationModal';
import FloatingButtons from './FloatingButtons';
import {
  Play, Users, TrendingUp, ShieldCheck,
  ArrowRight, Star, CheckCircle2, MonitorPlay,
  Award, Globe, Zap, ChevronRight, ChevronDown, ChevronUp, Menu, X,
  MessageCircle, BookOpen, GraduationCap, Phone, Mail, MapPin,
  Clock, Heart, Target, Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = React.useState(false);
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden selection:bg-blue-100">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-blue-900">Lakshita Academy</span>
          </div>

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
              <a
                href="https://wa.me/919515126201"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                Enroll Now — Call/WhatsApp
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
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
      </section>      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* About Academy & Mission */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-black mb-6 text-blue-950">About Lakshita Trading Academy</h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Lakshita Trading Academy is a professional stock market training institute (online & offline) based in Tirupati.
                  We focus on practical learning, live market understanding, discipline, and risk management.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                <h3 className="text-2xl font-bold mb-3 text-blue-950">Our Mission</h3>
                <p className="text-slate-600 leading-relaxed">
                  To create disciplined traders who understand <strong className="text-blue-900">risk before profit</strong> and <strong className="text-blue-900">consistency before excitement</strong>. 
                  Our goal is to transform existing traders into confident and consistent market participants.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="text-blue-700 shrink-0 mt-1" size={24} />
                <p className="text-slate-700 font-medium">We don't teach theory alone — we train you for real market conditions.</p>
              </div>
            </div>

            <div className="relative rounded-[40px] overflow-hidden border-8 border-white shadow-2xl">
              <img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Trading environment" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-950 to-transparent p-8 pt-20">
                <p className="text-white font-bold text-xl">Practical & Disciplined Approach</p>
              </div>
            </div>
          </div>

          {/* About Trainer */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="relative z-10 rounded-[40px] overflow-hidden border-[8px] border-white shadow-2xl aspect-[4/5] bg-blue-50 max-w-sm mx-auto">
                <img src="/founder.png" alt="K.Y. Sampangi" className="w-full h-full object-contain" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl"></div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-4xl font-black mb-2 text-blue-950">About the Trainer</h2>
              <h3 className="text-2xl font-bold text-blue-700 mb-6">K.Y. Sampangi</h3>
              <p className="text-slate-500 font-medium uppercase tracking-wider text-sm mb-8">
                Founder • Trader • Mentor • Market Analyst
              </p>
              
              <div className="space-y-4">
                <p className="text-slate-600 text-lg leading-relaxed mb-6">
                  With practical market experience and a disciplined approach, Sampangi focuses on building confident and emotionally strong traders.
                </p>
                
                {[
                  'Professional Market Analysis',
                  'Focus on Trading Psychology & Emotional Strength',
                  'Expert in Risk Management Systems',
                ].map((point, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="text-white" size={14} />
                    </div>
                    <span className="font-medium text-slate-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>
      {/* Why Choose Us Section */}
      <section id="why-us" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-blue-950">Why Choose Lakshita Academy?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">A structured and disciplined approach to market education.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <GraduationCap />, title: 'From Zero to Teaching', desc: 'Comprehensive education from absolute basics to advanced levels.' },
              { icon: <Heart />, title: 'Psychology & Discipline', desc: 'Focus extensively on practical trader psychology and building discipline.' },
              { icon: <MonitorPlay />, title: 'Live Market Analysis', desc: 'Learn to analyze and execute trades during live market sessions.' },
              { icon: <Users />, title: 'Limited Batch Size', desc: 'Small batches ensure personal attention and dedicated doubt clearing.' },
              { icon: <BookOpen />, title: 'Step-by-Step Learning', desc: 'Highly structured and step-by-step curriculum for easy grasping.' },
              { icon: <ShieldCheck />, title: 'Focus on Risk Management', desc: 'We prioritize capital protection and risk management above all else.' }
            ].map((item, idx) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }} key={idx} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 transition-all shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-blue-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Highlights Section */}
      <section id="courses" className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 text-blue-950">Our Course Highlights</h2>
              <p className="text-slate-600 text-lg mb-10">
                A highly comprehensive curriculum that transforms you into a professional, self-sufficient trader.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {[
                  'Basic Stock Market Foundation',
                  'SEBI, NSE & BSE Understanding',
                  'Demat Account & Order Types',
                  'Candlestick Clear Information',
                  'Strict Entry / Exit Rules',
                  'Advanced Risk Management System',
                  'Intraday Trading Strategy',
                  'Capital Protection Rules',
                  'Trading Discipline Framework'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                    <span className="text-sm font-bold text-slate-800">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-12 bg-white rounded-3xl p-8 border border-blue-100 shadow-xl max-w-md">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Ready to Start?</p>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-2xl font-black text-blue-950">Join Our Next Batch</p>
                  <button onClick={() => setIsEnrollOpen(true)} className="px-6 py-3 rounded-2xl font-bold bg-blue-900 text-white hover:bg-blue-800 transition-all shadow-lg active:scale-95">
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/5 blur-3xl transform -rotate-6 rounded-[60px]"></div>
              <img src="https://images.unsplash.com/photo-1611974714658-75d4f1ad308e?auto=format&fit=crop&q=80&w=800" className="relative z-10 rounded-[40px] shadow-2xl border-8 border-white object-cover aspect-[4/3]" alt="Course Materials" />
              
              <div className="absolute -bottom-8 -left-8 bg-blue-900 border-4 border-white text-white p-6 rounded-3xl shadow-2xl z-20">
                <h4 className="text-xl font-black mb-1">Practical Learning</h4>
                <p className="text-blue-200 text-sm">Offline & Online Available</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Who Can Join Section */}
      <section className="py-24 px-6 bg-blue-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Who Can Join?</h2>
            <p className="text-blue-200">Our program is designed to create value for individuals across all backgrounds.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: 'Existing Traders', desc: 'Looking to build consistency and emotional discipline.'},
              { title: 'Beginners', desc: 'With basic knowledge wanting a strong foundation.'},
              { title: 'Working Professionals', desc: 'Seeking secondary income streams safely.'},
              { title: 'Business Owners', desc: 'Looking to diversify and manage capital effectively.'},
              { title: 'Housewives', desc: 'Wanting financial independence from home.'},
              { title: 'Anyone Serious', desc: 'About making trading a professional career.'}
            ].map((persona, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <h3 className="text-xl font-bold mb-2 text-white">{persona.title}</h3>
                <p className="text-blue-200 text-sm">{persona.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
             <div className="inline-block border border-blue-400/30 bg-blue-900/40 backdrop-blur-sm rounded-full px-6 py-2">
                 <p className="text-blue-200 text-sm font-medium">Limited Seats Available • We accept only serious and committed traders.</p>
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

          <div className="grid md:grid-cols-3 gap-8">
            {[
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
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -8 }} key={idx} className={`p-8 rounded-3xl ${broker.color} border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow-xl`}>
                <h3 className={`text-2xl font-black mb-6 ${broker.textColor}`}>{broker.name}</h3>
                <ul className="space-y-3 mb-8">
                  {broker.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      {b}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-white rounded-xl font-bold text-slate-900 shadow-sm hover:shadow-md transition-all active:scale-95">
                  Open Account
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12 text-blue-950">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is this course suitable for complete beginners?", a: "Yes! Our Full Stock Market Course is specifically designed to take you from zero to advanced level." },
              { q: "In which language are the classes conducted?", a: "We teach exclusively in Telugu to ensure maximum clarity for our students from Telugu states." },
              { q: "Do you provide live market support?", a: "Yes, we conduct live market trading sessions and have daily doubt clarification sessions." },
              { q: "How long is the course duration?", a: "Most of our comprehensive modules are designed to be completed in one month of intensive learning." }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer hover:shadow-md transition-all duration-300" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                <div className="flex justify-between items-center">
                  <h4 className={`font-bold transition-colors ${activeFaq === i ? 'text-blue-600' : 'text-blue-900'}`}>{faq.q}</h4>
                  {activeFaq === i ? <ChevronUp size={20} className="text-blue-600" /> : <ChevronDown size={20} className="text-blue-400" />}
                </div>
                {activeFaq === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
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
                  <p className="text-blue-200 text-sm leading-relaxed">Lakshita Trading Academy,<br />Hyderabad, Telangana</p>
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
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <input type="tel" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="+91 999999999" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                <textarea required rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-[0.98]">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900 to-blue-950 rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">Start Your Success Story Today</h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Join Lakshita Trading Academy and master the markets with Sampangi.</p>
            <button onClick={() => setIsEnrollOpen(true)} className="px-10 py-5 bg-white text-blue-900 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-xl">
              Enroll for Free Demo Class
            </button>
            <div className="mt-8 flex items-center justify-center gap-8 text-white/60">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span className="text-sm font-medium">+91 9515126201</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span className="text-sm font-medium">info@lakshitaacademy.in</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <GraduationCap className="text-blue-950" size={18} />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Lakshita Academy</span>
              </div>
              <p className="text-blue-200/60 max-w-sm leading-relaxed mb-6">
                Empowering retail traders with practical education.
              </p>
              
              {/* Disclaimer */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl max-w-md mt-4">
                <p className="text-[11px] uppercase tracking-wider text-blue-300 font-bold mb-2">Disclaimer</p>
                <div className="text-xs text-white/50 space-y-1">
                  <p>• Stock market trading involves financial risk.</p>
                  <p>• Lakshita Trading Academy provides educational training only.</p>
                  <p>• We do NOT provide any calls/tips, investment advice, or guaranteed profit.</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Courses</h4>
              <ul className="space-y-4 text-sm text-blue-200/60">
                <li><a href="#courses" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Course Highlights</a></li>
                <li><a href="#about" className="hover:text-white hover:translate-x-1 inline-block transition-transform">About Trainer</a></li>
                <li><a href="#brokers" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Brokers</a></li>
                <li><button onClick={() => setIsEnrollOpen(true)} className="hover:text-white hover:translate-x-1 inline-block transition-transform">Contact for Offline Batch</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-blue-200/60">
                <li><a href="#contact" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Contact Us</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Terms of Use</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-blue-200/40">© 2024 Lakshita Trading Academy. All rights reserved.</p>
              <p className="text-sm text-blue-200/40 mt-1">Built with love by <a href="https://www.rajugariventures.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white underline transition-colors">Rajugari Ventures</a></p>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-blue-200/40 hover:text-white hover:scale-110 transition-all"><Globe size={24} /></a>
              <a href="#" className="text-blue-200/40 hover:text-[#25D366] hover:scale-110 transition-all"><MessageCircle size={24} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

