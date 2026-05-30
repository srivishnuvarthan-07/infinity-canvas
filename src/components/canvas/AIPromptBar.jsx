import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, KeyRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SignupModal } from '@/components/auth/SignupModal';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { AIPanel } from './AIPanel';

const DAILY_LIMIT = 10;

// ── Dot progress indicator ────────────────────────────────────────────────────
function PromptDots({ used, total = DAILY_LIMIT }) {
    return (
        <div className="flex items-center gap-[3px]">
            {Array.from({ length: total }).map((_, i) => (
                <span
                    key={i}
                    className={`block rounded-full transition-all duration-300 ${
                        i < used
                            ? 'w-[6px] h-[6px] bg-indigo-300'   // used — dim
                            : 'w-[7px] h-[7px] bg-indigo-600'   // remaining — bright
                    }`}
                />
            ))}
        </div>
    );
}

// ── Locked overlay card ────────────────────────────────────────────────────────
function LockedCard({ onAddKey, onClose }) {
    return (
        <div className="absolute bottom-20 left-4 z-50 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl w-[300px] overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                            <Lock className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                            <div className="text-[13px] font-semibold text-neutral-900 leading-tight">Daily limit reached</div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">All 10 free prompts used</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-neutral-300 hover:text-neutral-500 transition-colors mt-0.5">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Dot progress — all used */}
                <div className="px-5 pb-4">
                    <div className="flex items-center gap-[3px] mb-3">
                        {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                            <span key={i} className="block w-[6px] h-[6px] rounded-full bg-neutral-200" />
                        ))}
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Your 10 daily prompts reset at midnight. Add your own API key for <strong className="text-neutral-700">unlimited generation</strong> — no restrictions.
                    </p>
                </div>

                {/* CTA */}
                <div className="border-t border-neutral-100 px-5 py-3 bg-neutral-50/60 flex items-center gap-2">
                    <button
                        onClick={onAddKey}
                        className="flex-1 flex items-center justify-center gap-2 h-9 bg-neutral-900 hover:bg-neutral-800 text-white text-[12px] font-medium rounded-xl transition-colors"
                    >
                        <KeyRound className="w-3.5 h-3.5" />
                        Add API key
                    </button>
                    <div className="text-[10px] text-neutral-400 text-center leading-tight">
                        Resets<br/>midnight
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AIPromptBar({ onInsertShapes, onAddToLibrary }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [usageInfo, setUsageInfo] = useState(null);
    const [showLocked, setShowLocked] = useState(false);

    const fetchUsage = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/profile/ai-config/usage?t=${Date.now()}`);
            if (res.data.success) setUsageInfo(res.data);
        } catch (err) {
            console.error('Failed to fetch usage info', err);
        }
    };

    useEffect(() => { if (user) fetchUsage(); }, [user]);
    useEffect(() => { if (user && isOpen) fetchUsage(); }, [user, isOpen]);
    useEffect(() => {
        if (!user) return;
        const onFocus = () => fetchUsage();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user]);

    const isGuest = !user;
    const isUnlimited = usageInfo?.unlimited;
    const isLimitReached = !isGuest && usageInfo && usageInfo.remaining === 0 && !isUnlimited;
    const used = usageInfo && !isUnlimited ? (DAILY_LIMIT - usageInfo.remaining) : 0;
    const isLockedUI = isGuest || isLimitReached;

    // ── Locked overlay card ────────────────────────────────────────────────────
    if (showLocked && isLimitReached) {
        return (
            <>
                <LockedCard
                    onAddKey={() => { setShowLocked(false); navigate('/dashboard/settings'); }}
                    onClose={() => setShowLocked(false)}
                />
                <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} />
            </>
        );
    }

    // ── Collapsed trigger button ───────────────────────────────────────────────
    if (!isOpen) {
        return (
            <>
                <button
                    onClick={() => {
                        if (isGuest) { setIsSignupModalOpen(true); return; }
                        if (isLimitReached) { setShowLocked(true); return; }
                        setIsOpen(true);
                    }}
                    className={`absolute bottom-5 left-4 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg z-50 pointer-events-auto
                        transition-all duration-200 hover:scale-105 active:scale-95
                        ${isLockedUI
                            ? 'bg-neutral-100 border border-neutral-200 text-neutral-400'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                >
                    {isLockedUI
                        ? <Lock className="w-3.5 h-3.5 text-neutral-400" />
                        : <Sparkles className="w-3.5 h-3.5" />
                    }
                    <span className="font-medium text-xs">
                        {isLockedUI ? 'AI Locked' : 'AI Generate'}
                    </span>

                    {/* Usage dots */}
                    {!isGuest && usageInfo && !isUnlimited && !isLimitReached && (
                        <PromptDots used={used} total={DAILY_LIMIT} />
                    )}
                </button>
                <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} />
            </>
        );
    }

    // ── AI Panel (open state) ──────────────────────────────────────────────────
    return (
        <div className="absolute bottom-20 left-4 z-50 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-200">
            <AIPanel
                onClose={() => setIsOpen(false)}
                onInsertShapes={(shapes) => {
                    onInsertShapes(shapes);
                    fetchUsage(); // refresh usage after generation
                }}
                onAddToLibrary={onAddToLibrary}
                usageInfo={usageInfo}
                isUnlimited={isUnlimited}
            />
        </div>
    );
}
