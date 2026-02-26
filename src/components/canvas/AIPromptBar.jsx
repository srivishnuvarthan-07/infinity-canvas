import React, { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { getAIService } from '@/services/ai.service';
import { generateDiagramShapes } from '@/engine/ai/diagram.generator';
import { toast } from 'sonner';

export function AIPromptBar({ onInsertShapes }) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_GENAI_API_KEY;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        if (!apiKey) {
            toast.error('Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env');
            return;
        }

        setIsGenerating(true);
        try {
            const aiService = getAIService(apiKey);
            const intent = await aiService.generateMermaid(prompt);

            if (intent.intent_type === 'non_visual') {
                toast.info(intent.suggestion || 'The request is not visual. Please provide a description for a diagram.');
            } else if (intent.intent_type === 'visual') {
                const newShapes = generateDiagramShapes(intent);
                if (newShapes && newShapes.length > 0) {
                    onInsertShapes(newShapes);
                    toast.success('Generated Mermaid diagram!');
                    setPrompt('');
                    setIsOpen(false);
                } else {
                    toast.error('Could not parse the diagram.');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate diagram: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 z-50 pointer-events-auto"
            >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium mr-1">Generate Diagram</span>
            </button>
        );
    }

    return (
        <div className="absolute bottom-6 left-6 w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-50 pointer-events-auto">
            <form
                onSubmit={handleGenerate}
                className="flex items-center gap-2 bg-white dark:bg-neutral-900 border rounded-full shadow-2xl p-2 pl-6 pr-2"
            >
                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a diagram (e.g. 'Binary tree with 10 5 15')"
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground min-w-0"
                    disabled={isGenerating}
                    autoFocus
                />
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
                        disabled={isGenerating}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isGenerating || !prompt.trim()}
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
        </div>
    );
}
