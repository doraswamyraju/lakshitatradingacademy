import React, { useState } from 'react';
import { X, CheckCircle2, Shield, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AliceBlueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AliceBlueModal: React.FC<AliceBlueModalProps> = ({ isOpen, onClose }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        pan: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/aliceblue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsSubmitted(true);
                setTimeout(() => {
                    setIsSubmitted(false);
                    onClose();
                    setFormData({ name: '', email: '', phone: '', pan: '' });
                }, 4000);
            } else {
                alert('Submission failed. Please try again.');
            }
        } catch {
            alert('Error connecting to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0B0C15]/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#151725] rounded-[48px] shadow-2xl border border-white/5 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-10 py-10 bg-blue-600 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 text-white/10 pointer-events-none">
                                <Shield size={160} />
                            </div>
                            <div className="absolute top-4 right-4 z-20">
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                        <Shield className="text-white" size={28} />
                                    </div>
                                    <span className="bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/10">Official Partner</span>
                                </div>
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase">Alice Blue</h3>
                                <p className="text-blue-100 text-xs font-black uppercase tracking-widest mt-2">Open Your Free Demat Account</p>
                            </div>
                        </div>

                        <div className="p-10">
                            {isSubmitted ? (
                                <div className="flex flex-col items-center text-center py-10">
                                    <div className="w-24 h-24 bg-green-500/10 rounded-[32px] flex items-center justify-center mb-8 border border-green-500/20">
                                        <CheckCircle2 className="text-green-500" size={48} />
                                    </div>
                                    <h4 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Application Received!</h4>
                                    <p className="text-slate-400 font-bold">Our dedicated partnership team will reach out to you within 24 hours to finalize your account setup.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Full Name (As per PAN)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:border-blue-500 transition-all outline-none text-white font-bold"
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Email ID</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:border-blue-500 transition-all outline-none text-white font-bold"
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:border-blue-500 transition-all outline-none text-white font-bold"
                                                    placeholder="+91"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">PAN Number</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.pan}
                                                    onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                                                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:border-blue-500 transition-all outline-none text-white font-bold"
                                                    placeholder="ABCDE1234F"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-70 text-lg flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? 'Processing Application...' : 'Apply for Free Account'}
                                            <ArrowRight size={20} />
                                        </button>
                                        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                                            <Zap size={14} className="text-yellow-500" />
                                            Fast Onboarding Powered by Alice Blue
                                        </p>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AliceBlueModal;
