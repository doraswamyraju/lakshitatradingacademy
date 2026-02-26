import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, ArrowUp } from 'lucide-react';

const FloatingButtons = () => {
    const [showScroll, setShowScroll] = useState(false);
    const phoneNumber = '+919948157156';
    const whatsappNumber = '919948157156';

    useEffect(() => {
        const handleScroll = () => {
            setShowScroll(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {showScroll && (
                <button
                    onClick={scrollToTop}
                    className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 hover:-translate-y-1 transition-all active:scale-95 group"
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
                </button>
            )}

            <a
                href={`tel:${phoneNumber}`}
                className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 hover:-translate-y-1 transition-all active:scale-95 group relative"
                aria-label="Call us"
                title="Call Us"
            >
                <span className="absolute right-14 bg-white text-slate-900 text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
                    Call Us
                </span>
                <Phone size={24} className="group-hover:rotate-12 transition-transform" />
            </a>

            <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:-translate-y-1 transition-all active:scale-95 group relative"
                aria-label="WhatsApp us"
                title="WhatsApp Us"
            >
                <span className="absolute right-16 bg-white text-slate-900 text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
                    WhatsApp Us
                </span>
                <MessageCircle size={32} />
            </a>
        </div>
    );
};

export default FloatingButtons;
