import React from 'react';
import { motion } from 'motion/react';
import RegistrationModal from './RegistrationModal';
import FloatingButtons from './FloatingButtons';
import {
  Play, Users, TrendingUp, ShieldCheck,
  ArrowRight, Star, CheckCircle2, MonitorPlay,
  Award, Globe, Zap, ChevronRight, Menu, X,
  MessageCircle, BookOpen, GraduationCap, Phone, Mail, MapPin,
  Clock, Heart, Target, Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = React.useState(false);

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
              <span className="text-xs font-bold tracking-widest uppercase text-blue-900/60">Learn Stock Market From Zero</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8 text-blue-950"
            >
              Start Your <br />
              <span className="text-blue-700">Successful</span> <br />
              Trading Journey
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 max-w-xl mb-10 leading-relaxed"
            >
              Master the stock market with **Sampangi**. We provide institutional-grade training in Telugu, designed to make you a consistently profitable trader.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button onClick={() => setIsEnrollOpen(true)} className="w-full sm:w-auto px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                Enroll for Free Demo
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

      {/* About Founder Section */}
      <section id="about" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl font-black mb-6 text-blue-950">Meet Your Mentor: Sampangi</h2>
            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              With years of experience in the financial markets, Sampangi founded Lakshita Trading Academy to bridge the gap between retail traders and institutional success.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'Expert in Technical Analysis & Price Action',
                'Specialized in Options Buying & Selling Strategies',
                'Pioneer in Algorithmic Trading Education in Telugu',
                'Dedicated to Daily Doubt Clarification'
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="text-white" size={14} />
                  </div>
                  <span className="font-medium text-slate-700">{point}</span>
                </div>
              ))}
            </div>
            <button className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-blue-900 hover:bg-slate-50 transition-all">
              Learn More About My Journey
            </button>
          </div>
          <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=400" className="rounded-3xl shadow-lg" alt="Trading" />
              <div className="bg-blue-900 p-8 rounded-3xl text-white">
                <h4 className="text-4xl font-black mb-2">10+</h4>
                <p className="text-blue-200 text-sm">Years Experience</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200">
                <h4 className="text-4xl font-black mb-2 text-blue-900">5k+</h4>
                <p className="text-slate-500 text-sm">Live Sessions</p>
              </div>
              <img src="https://images.unsplash.com/photo-1611974714658-75d4f1ad308e?auto=format&fit=crop&q=80&w=400" className="rounded-3xl shadow-lg" alt="Analysis" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section (Content from site) */}
      <section id="why-us" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-blue-950">Why Choose Lakshita Academy?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We provide a unique learning environment designed for your success.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Globe className="text-blue-600" size={32} />,
                title: 'Telugu Language',
                desc: 'Specially designed for Telugu states to make stock market education accessible.'
              },
              {
                icon: <Clock className="text-blue-700" size={32} />,
                title: 'Daily Doubt Clearing',
                desc: 'Clarify your doubts on the same day after class with our dedicated sessions.'
              },
              {
                icon: <MessageCircle className="text-blue-800" size={32} />,
                title: 'WhatsApp Support',
                desc: 'Stay updated with our exclusive WhatsApp group for lifelong communication.'
              },
              {
                icon: <Target className="text-blue-900" size={32} />,
                title: 'Basic to Advanced',
                desc: 'Learn everything from scratch to institutional level in just one month.'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 transition-all shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-blue-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-blue-950">Our Signature Courses</h2>
            <p className="text-slate-600">Choose the path that fits your trading goals.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: 'Full Stock Market Course',
                desc: 'Complete journey from basics to professional trading. Ideal for beginners.',
                features: ['Equity Basics', 'Technical Analysis', 'Risk Management', 'Live Trading'],
                price: '₹14,999',
                popular: true
              },
              {
                title: 'Advanced Technicals Master Course',
                desc: 'Deep dive into institutional concepts and complex price action strategies.',
                features: ['Advanced Indicators', 'Gann Theory', 'Institutional Flow', 'Algo Integration'],
                price: '₹19,999',
                popular: false
              }
            ].map((course, idx) => (
              <div key={idx} className={`p-8 rounded-[40px] bg-white border ${course.popular ? 'border-blue-500 shadow-2xl' : 'border-slate-200 shadow-sm'} relative overflow-hidden`}>
                {course.popular && (
                  <div className="absolute top-6 right-6 px-4 py-1 bg-blue-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-black text-blue-950 mb-4">{course.title}</h3>
                <p className="text-slate-500 mb-8 text-sm">{course.desc}</p>
                <div className="space-y-4 mb-10">
                  {course.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="text-blue-600" size={18} />
                      <span className="text-sm font-medium text-slate-700">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Course Fee</p>
                    <p className="text-3xl font-black text-blue-900">{course.price}</p>
                  </div>
                  <button onClick={() => setIsEnrollOpen(true)} className={`px-6 py-3 rounded-2xl font-bold transition-all ${course.popular ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-slate-100 text-blue-900 hover:bg-slate-200'}`}>
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
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
              <div key={idx} className={`p-8 rounded-3xl ${broker.color} border border-transparent hover:border-slate-200 transition-all`}>
                <h3 className={`text-2xl font-black mb-6 ${broker.textColor}`}>{broker.name}</h3>
                <ul className="space-y-3 mb-8">
                  {broker.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      {b}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-white rounded-xl font-bold text-slate-900 shadow-sm hover:shadow-md transition-all">
                  Open Account
                </button>
              </div>
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
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-blue-900 mb-2">{faq.q}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
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
              <div key={idx} className="relative p-8 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-2xl mb-6 shadow-lg shadow-blue-900/20">{s.step}</div>
                <h3 className="text-xl font-bold mb-3 text-blue-900">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                {idx < 3 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-blue-200"></div>}
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative pt-12">
                <div className="absolute -top-6 left-8">
                  <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="Student" className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-white" />
                </div>
                <div className="flex gap-1 mb-4 text-yellow-400">
                  <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                </div>
                <p className="text-slate-600 italic mb-6">"Joining Lakshita Academy was the best decision. The way Sampangi explains complex concepts in Telugu is outstanding. I am now trading profitably every month."</p>
                <div>
                  <h4 className="font-bold text-blue-950">Student Name {i}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mt-1">Full Stock Market Course</p>
                </div>
              </div>
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
                  <p className="text-blue-200 text-sm">+91 9948157156</p>
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
                <span className="text-sm font-medium">+91 9948157156</span>
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
              <p className="text-blue-200/60 max-w-sm leading-relaxed">
                Empowering retail traders with institutional-grade education in Telugu. Founded by Sampangi.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Courses</h4>
              <ul className="space-y-4 text-sm text-blue-200/60">
                <li><a href="#" className="hover:text-white transition-colors">Full Market Course</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Advanced Technicals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Options Specialization</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Free Demo Class</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-blue-200/60">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SEBI Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-blue-200/40">© 2024 Lakshita Trading Academy. All rights reserved.</p>
              <p className="text-sm text-blue-200/40 mt-1">Built with love by <a href="https://www.rajugariventures.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white underline transition-colors">Rajugari Ventures</a></p>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-blue-200/40 hover:text-white transition-colors"><Globe size={20} /></a>
              <a href="#" className="text-blue-200/40 hover:text-white transition-colors"><MessageCircle size={20} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

