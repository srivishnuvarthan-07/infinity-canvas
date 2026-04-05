import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send, Lock, KeyRound, X, Zap } from 'lucide-react';
import { getAIService } from '@/services/ai.service';
import { generateDiagramShapes } from '@/engine/ai/diagram.generator';
import { generateDSAShapes } from '@/engine/ai/dsa.generator';
import { generateMindMapShapes } from '@/engine/ai/mindmap.generator';
import { generateComparisonShapes } from '@/engine/ai/comparison.generator';
import { generateERDShapes } from '@/engine/ai/erd.generator';
import { generateCodeFlowchartShapes } from '@/engine/ai/code.flowchart.generator';
import { validateGraph } from '@/engine/ai/graph.schema';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SignupModal } from '@/components/auth/SignupModal';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

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
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [usageInfo, setUsageInfo] = useState(null);
    const [showLocked, setShowLocked] = useState(false);

    const fetchUsage = async () => {
        if (!user) return;
        try {
            // Add cache-buster to ensure we get fresh state from server
            const res = await api.get(`/profile/ai-config/usage?t=${Date.now()}`);
            if (res.data.success) setUsageInfo(res.data);
        } catch (err) {
            console.error('Failed to fetch usage info', err);
        }
    };

    // Fetch on user login
    useEffect(() => { if (user) fetchUsage(); }, [user]);

    // Re-fetch whenever the bar opens
    useEffect(() => { if (user && isOpen) fetchUsage(); }, [user, isOpen]);

    // Re-fetch when window regains focus (e.g. after returning from Settings)
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
    
    // Summary states for UI
    const isLockedUI = isGuest || isLimitReached;

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim()) return;

        if (!user) { setIsSignupModalOpen(true); return; }

        if (isLimitReached) {
            setShowLocked(true);
            setIsOpen(false);
            return;
        }

        setIsGenerating(true);
        try {
            const aiService = getAIService();
            toast.loading('Analysing prompt...', { id: 'ai-gen' });
            const intent = await aiService.generateGraphJSON(prompt);
            fetchUsage();

            if (intent.intent_type === 'non_visual') {
                toast.dismiss('ai-gen');
                toast.info(intent.suggestion || 'The request is not visual. Please provide a description for a diagram.', { duration: 5000 });
            } else if (intent.intent_type === 'code_flowchart') {
                const shapes = generateCodeFlowchartShapes(intent);
                if (shapes?.length) {
                    onInsertShapes(shapes);
                    if (onAddToLibrary) try { onAddToLibrary(shapes, `Code: ${intent.code_flowchart?.title || 'Flowchart'}`); } catch {}
                    toast.success(`Code flowchart generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the code flowchart.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'comparison') {
                const shapes = generateComparisonShapes(intent);
                if (shapes?.length) {
                    onInsertShapes(shapes);
                    if (onAddToLibrary) try { onAddToLibrary(shapes, 'AI Comparison'); } catch {}
                    toast.success(`Comparison table generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the comparison table.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'erd') {
                const shapes = generateERDShapes(intent);
                if (shapes?.length) {
                    onInsertShapes(shapes);
                    if (onAddToLibrary) try { onAddToLibrary(shapes, 'AI ERD'); } catch {}
                    toast.success(`ERD generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the ERD.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'mindmap') {
                const shapes = generateMindMapShapes(intent);
                if (shapes?.length) {
                    onInsertShapes(shapes);
                    if (onAddToLibrary) try { onAddToLibrary(shapes, 'AI Mind Map'); } catch {}
                    toast.success(`Mind map generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the mind map.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'dsa') {
                const shapes = generateDSAShapes(intent);
                if (shapes?.length) {
                    onInsertShapes(shapes);
                    if (onAddToLibrary) try { onAddToLibrary(shapes, 'AI DSA Diagram'); } catch {}
                    toast.success(`DSA visualization generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the DSA structure.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'diagram') {
                const isExplanation = intent.graph?.diagramMode === 'explanation';
                if (!isExplanation) {
                    const validation = validateGraph(intent.graph);
                    if (!validation.success) {
                        toast.error('AI returned an invalid diagram format. Please try again.', { id: 'ai-gen' });
                        return;
                    }
                }
                const shapes = generateDiagramShapes(intent);
                if (shapes?.length) {
                    onInsertShapes(shapes);
                    if (onAddToLibrary) try { onAddToLibrary(shapes, 'AI Diagram'); } catch {}
                    toast.success(`Diagram generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not layout the diagram.', { id: 'ai-gen' }); }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate diagram: ' + error.message, { id: 'ai-gen' });
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Locked overlay card ────────────────────────────────────────────────────
    if (showLocked && isLimitReached) {
        return (
            <>
                <LockedCard
                    onAddKey={() => { setShowLocked(false); navigate('/dashboard/settings'); }}
                    onClose={() => setShowLocked(false)}
                />
                <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} onSuccess={() => handleGenerate()} />
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
                    className={`absolute bottom-20 left-4 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg z-50 pointer-events-auto
                        transition-all duration-200 hover:scale-105 active:scale-95
                        ${isLockedUI
                            ? 'bg-neutral-100 border border-neutral-200 text-neutral-400'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                >
                    {isLockedUI
                        ? <Lock className="w-4 h-4 text-neutral-400" />
                        : <Sparkles className="w-4 h-4" />
                    }
                    <span className="font-medium text-sm">
                        {isLockedUI ? 'Locked' : 'Generate Diagram'}
                    </span>

                    {/* Usage dots — only when logged in and on free tier */}
                    {!isGuest && usageInfo && !isUnlimited && !isLimitReached && (
                        <PromptDots used={used} total={DAILY_LIMIT} />
                    )}
                </button>
                <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} onSuccess={() => handleGenerate()} />
            </>
        );
    }

    // ── Expanded prompt bar ────────────────────────────────────────────────────
    return (
        <div className="absolute bottom-20 left-4 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-50 pointer-events-auto">
            <div className="flex flex-col gap-2">

                {/* Main input bar */}
                <form
                    onSubmit={handleGenerate}
                    className="flex items-center gap-2 bg-white border border-neutral-200 rounded-2xl shadow-2xl px-4 py-2"
                >
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe a diagram, flowchart, ERD, mind map, DSA, or paste code..."
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[13px] text-neutral-800 placeholder:text-neutral-400 min-w-0 py-2"
                        disabled={isGenerating}
                        autoFocus
                    />

                    {/* Usage indicator inside bar */}
                    {user && usageInfo && !isUnlimited && (
                        <div className="flex items-center gap-2 shrink-0 border-l border-neutral-100 pl-3 ml-1">
                            <PromptDots used={used} total={DAILY_LIMIT} />
                            <span className="text-[10px] font-medium text-neutral-400 whitespace-nowrap">
                                {usageInfo.remaining} left
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors"
                            disabled={isGenerating}
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            type="submit"
                            disabled={isGenerating || !prompt.trim()}
                            className="flex items-center justify-center w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 transition-colors"
                        >
                            {isGenerating
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Send className="w-4 h-4" />
                            }
                        </button>
                    </div>
                </form>

                {/* Hint row */}
                {!isGuest && usageInfo && !isUnlimited && (
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-neutral-400">
                            {usageInfo.remaining} of {DAILY_LIMIT} daily prompts remaining · resets at midnight
                        </span>
                        <button
                            onClick={() => { setIsOpen(false); navigate('/dashboard/settings'); }}
                            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                        >
                            Add API key →
                        </button>
                    </div>
                )}
            </div>

            <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} onSuccess={() => handleGenerate()} />
        </div>
    );
}
