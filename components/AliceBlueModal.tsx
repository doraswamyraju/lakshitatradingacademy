import React, { useState } from 'react';
import { X, CheckCircle2, Shield } from 'lucide-react';
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-10 py-8 bg-blue-900 text-white relative">
                           <div className="absolute top-0 right-0 p-4">
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                           </div>
                           <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <Shield className="text-blue-300" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tight">Alice Blue Partnership</h3>
                                    <p className="text-blue-200 text-sm">Open your free demat account via Lakshita Academy</p>
                                </div>
                           </div>
                        </div>

                        <div className="p-10">
                            {isSubmitted ? (
                                <div className="flex flex-col items-center text-center py-10">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="text-green-600" size={40} />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-800 mb-2">Request Received!</h4>
                                    <p className="text-slate-600">Our partnership team will get in touch with you shortly to complete the onboarding process.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                placeholder="Enter your name as per PAN"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Email ID</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                    placeholder="+91"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">PAN Number</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.pan}
                                                    onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                    placeholder="ABCDE1234F"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Submit Details'}
                                    </button>

                                    <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">Secure Verification Powered by Alice Blue</p>
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
