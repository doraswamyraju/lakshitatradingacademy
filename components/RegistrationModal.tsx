import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        course: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsSubmitted(true);
                setTimeout(() => {
                    setIsSubmitted(false);
                    onClose();
                    setFormData({ name: '', email: '', phone: '', course: '' });
                }, 3000);
            } else {
                alert('Failed to submit enrollment.');
            }
        } catch {
            alert('Error connecting to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B0C15]/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#151725] rounded-[40px] shadow-2xl border border-white/5 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-10 py-8 bg-green-600 text-[#0B0C15] flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 text-[#0B0C15]/10 pointer-events-none">
                                <Zap size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Lakshita Trading Academy</h3>
                                <p className="text-[#0B0C15]/70 text-xs font-black uppercase tracking-widest mt-1">Lakshita Trading Solutions</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="relative z-10 p-2 text-[#0B0C15]/70 hover:text-[#0B0C15] hover:bg-black/5 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-10">
                            {isSubmitted ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-24 h-24 bg-green-500/10 rounded-[32px] flex items-center justify-center mb-8 border border-green-500/20"
                                    >
                                        <CheckCircle2 className="text-green-500" size={48} />
                                    </motion.div>
                                    <h4 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Request Received!</h4>
                                    <p className="text-slate-400 font-bold">
                                        Thank you, {formData.name}. Our expert team will contact you shortly to schedule your demo.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:border-green-500 transition-all outline-none text-white font-bold"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:border-green-500 transition-all outline-none text-white font-bold"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:border-green-500 transition-all outline-none text-white font-bold"
                                                placeholder="+91"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Select Interest</label>
                                        <select
                                            name="course"
                                            required
                                            value={formData.course}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 bg-[#1A1C2E] border border-white/5 rounded-2xl focus:border-green-500 transition-all outline-none text-slate-300 font-bold"
                                        >
                                            <option value="">Choose an option</option>
                                            <option value="Algo Demo Session">Live Algo Demo Session (₹499)</option>
                                            <option value="Lakshita Algo Setup">Lakshita Algo Complete Setup</option>
                                            <option value="Basic Trading Course">Basic Trading Course (Bonus)</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                        </select>
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-5 bg-green-600 text-[#0B0C15] rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-green-600/20 hover:bg-green-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                                        >
                                            {isSubmitting ? 'Processing...' : 'Secure Your Spot'}
                                        </button>
                                        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                                            <ShieldCheck size={14}/>
                                            100% Secure & Confidential
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

export default RegistrationModal;
