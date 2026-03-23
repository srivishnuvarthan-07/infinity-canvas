import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send, Activity, Info } from 'lucide-react';
import { getAIService } from '@/services/ai.service';
import { generateDiagramShapes } from '@/engine/ai/diagram.generator';
import { generateDSAShapes } from '@/engine/ai/dsa.generator';
import { generateMindMapShapes } from '@/engine/ai/mindmap.generator';
import { generateComparisonShapes } from '@/engine/ai/comparison.generator';
import { generateERDShapes } from '@/engine/ai/erd.generator';
import { validateGraph } from '@/engine/ai/graph.schema';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SignupModal } from '@/components/auth/SignupModal';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

export function AIPromptBar({ onInsertShapes, onAddToLibrary }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [usageInfo, setUsageInfo] = useState(null);

    const fetchUsage = async () => {
        if (!user) return;
        try {
            const response = await api.get('/profile/ai-config/usage');
            if (response.data.success) {
                setUsageInfo(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch usage info", err);
        }
    };

    useEffect(() => {
        if (user && isOpen) {
            fetchUsage();
        }
    }, [user, isOpen]);

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim()) return;
        
        if (!user) {
            setIsSignupModalOpen(true);
            return;
        }

        if (usageInfo && usageInfo.remaining === 0 && !usageInfo.unlimited) {
            toast.error('Daily limit reached. Add your API key in profile for unlimited access.');
            navigate('/profile');
            return;
        }

        setIsGenerating(true);
        try {
            const aiService = getAIService();

            // Step 1: Generate JSON directly (expandPrompt is called internally)
            toast.loading('Analysing prompt...', { id: 'ai-gen' });
            const intent = await aiService.generateGraphJSON(prompt);

            // Update usage after generation
            fetchUsage();

            if (intent.intent_type === 'non_visual') {
                toast.dismiss('ai-gen');
                toast.info(intent.suggestion || 'The request is not visual. Please provide a description for a diagram.', { duration: 5000 });
            } else if (intent.intent_type === 'comparison') {
                const newShapes = generateComparisonShapes(intent);
                if (newShapes && newShapes.length > 0) {
                    onInsertShapes(newShapes);
                    if (onAddToLibrary) { try { onAddToLibrary(newShapes, 'AI Comparison'); } catch (e) {/* silent */} }
                    toast.success(`Comparison table generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the comparison table.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'erd') {
                const newShapes = generateERDShapes(intent);
                if (newShapes && newShapes.length > 0) {
                    onInsertShapes(newShapes);
                    if (onAddToLibrary) { try { onAddToLibrary(newShapes, 'AI ERD'); } catch (e) {/* silent */} }
                    toast.success(`ERD diagram generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the ERD.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'mindmap') {
                const newShapes = generateMindMapShapes(intent);
                if (newShapes && newShapes.length > 0) {
                    onInsertShapes(newShapes);
                    if (onAddToLibrary) { try { onAddToLibrary(newShapes, 'AI Mind Map'); } catch (e) { /* silent */ } }
                    toast.success(`Mind map generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the mind map.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'dsa') {
                const newShapes = generateDSAShapes(intent);
                if (newShapes && newShapes.length > 0) {
                    onInsertShapes(newShapes);
                    if (onAddToLibrary) { try { onAddToLibrary(newShapes, 'AI DSA Diagram'); } catch (e) { /* silent */ } }
                    toast.success(`DSA visualization generated via ${intent.meta?.provider || 'AI'}!`, { id: 'ai-gen' });
                    setPrompt(''); setIsOpen(false);
                } else { toast.error('Could not render the DSA structure.', { id: 'ai-gen' }); }
            } else if (intent.intent_type === 'diagram') {
                const validation = validateGraph(intent.graph);
                if (!validation.success) {
                    toast.error('AI returned an invalid diagram format. Please try again.', { id: 'ai-gen' });
                    return;
                }
                const newShapes = generateDiagramShapes(intent);
                if (newShapes && newShapes.length > 0) {
                    onInsertShapes(newShapes);
                    if (onAddToLibrary) { try { onAddToLibrary(newShapes, "AI Diagram"); } catch (e) {} }
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

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-20 left-4 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 z-50 pointer-events-auto"
            >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-sm">Generate Diagram</span>
            </button>
        );
    }

    const isLimitReached = usageInfo && usageInfo.remaining === 0 && !usageInfo.unlimited;

    return (
        <div className="absolute bottom-20 left-4 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-50 pointer-events-auto">
            <div className="flex flex-col gap-2">
                <form
                    onSubmit={handleGenerate}
                    className={`flex items-center gap-2 bg-white dark:bg-neutral-910 border rounded-full shadow-2xl p-2 pl-6 pr-2 ${isLimitReached ? 'border-red-200 bg-red-50/10' : ''}`}
                >
                    <Sparkles className={`w-5 h-5 shrink-0 ${isLimitReached ? 'text-red-400' : 'text-indigo-500'}`} />
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isLimitReached ? "Daily limit reached — add your API key" : "Describe what to generate — diagram, ERD, comparison, mind map, or DSA..."}
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground min-w-0"
                        disabled={isGenerating || isLimitReached}
                        onClick={() => isLimitReached && navigate('/profile')}
                        autoFocus
                    />
                    
                    {/* Provider Indicator */}
                    {usageInfo && (
                        <div className="px-3 py-1.5 rounded-full bg-neutral-100 flex items-center gap-2 mr-1">
                            <div className={`w-2 h-2 rounded-full ${usageInfo.unlimited ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-neutral-600">
                                {usageInfo.unlimited ? 'Custom Key' : `Free: ${usageInfo.remaining} left`}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 rounded-full transition-colors"
                            disabled={isGenerating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isGenerating || !prompt.trim() || isLimitReached}
                            className="flex items-center justify-center min-w-[40px] h-[40px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 transition-colors"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 ml-0.5" />
                            )}
                        </button>
                    </div>
                </form>
                
                {usageInfo && !usageInfo.unlimited && !isLimitReached && (
                    <div className="flex items-center gap-2 px-6 py-1">
                        <Info className="w-3 h-3 text-neutral-400" />
                        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                            Using system fallback. Add your own key in profile for unlimited generation.
                        </span>
                    </div>
                )}
            </div>

            <SignupModal 
                isOpen={isSignupModalOpen} 
                onOpenChange={setIsSignupModalOpen} 
                onSuccess={() => handleGenerate()} 
            />
        </div>
    );
}
