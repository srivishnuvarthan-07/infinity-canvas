import React, { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { getAIService } from '@/services/ai.service';
import { generateDiagramShapes } from '@/engine/ai/diagram.generator';
import { validateGraph } from '@/engine/ai/graph.schema';
import { toast } from 'sonner';

export function LibraryAIPrompt({ onGenerateSuccess }) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // We need to provide the Groq API Key. Generally it should come from env or user settings.
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        if (!apiKey) {
            toast.error('Groq API Key is missing. Please add VITE_GROQ_API_KEY to your .env');
            return;
        }

        setIsGenerating(true);
        try {
            const aiService = getAIService(apiKey);
            const intent = await aiService.generateGraphJSON(prompt);

            if (intent.intent_type === 'non_visual') {
                toast.info(intent.suggestion || 'The request is not visual. Please provide a description for a diagram.');
            } else if (intent.intent_type === 'diagram') {
                const validation = validateGraph(intent.graph);
                if (!validation.success) {
                    toast.error('AI returned an invalid diagram format. Please try again.');
                    console.error("Zod Validation Error:", validation.error);
                    return;
                }

                const newShapes = generateDiagramShapes(intent);
                if (newShapes && newShapes.length > 0) {
                    if (onGenerateSuccess) {
                        await onGenerateSuccess(newShapes, `AI Diagram`);
                    }
                    toast.success('Generated diagram and saved to Library!');
                    setPrompt('');
                } else {
                    toast.error('Could not layout diagram.');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate diagram: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">AI Generation</span>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col gap-2">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe a diagram (e.g. 'Binary tree with 10 5 15')"
                        className="w-full text-sm resize-none bg-white border border-neutral-300 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[60px]"
                        disabled={isGenerating}
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !prompt.trim()}
                        className="absolute bottom-2 right-2 flex items-center justify-center w-6 h-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm disabled:opacity-50 transition-colors"
                        title="Generate with AI"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Send className="w-3 h-3 ml-px" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
