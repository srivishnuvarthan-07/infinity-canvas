import { useState, useEffect } from 'react';
import { X, Sparkles, BookMarked, ArrowRight, RotateCcw } from 'lucide-react';
import { DiagramTypeChips, DIAGRAM_TYPES } from './DiagramTypeChips';
import { PromptInput } from './PromptInput';
import { DiagramPreview } from './DiagramPreview';

import { getAIService } from '@/services/ai.service';
import { generateDiagramShapes } from '@/engine/ai/diagram.generator';
import { generateDSAShapes } from '@/engine/ai/dsa.generator';
import { generateMindMapShapes } from '@/engine/ai/mindmap.generator';
import { generateComparisonShapes } from '@/engine/ai/comparison.generator';
import { generateERDShapes } from '@/engine/ai/erd.generator';
import { generateChartShapes } from '@/engine/ai/chart.generator';
import { validateGraph } from '@/engine/ai/graph.schema';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DAILY_LIMIT = 10;

function UsageDots({ used, total = DAILY_LIMIT }) {
    return (
        <div className="flex items-center gap-[3px]">
            {Array.from({ length: total }).map((_, i) => (
                <span
                    key={i}
                    className={`block rounded-full transition-all duration-300 ${
                        i < used
                            ? 'w-[5px] h-[5px] bg-indigo-200'
                            : 'w-[6px] h-[6px] bg-indigo-500'
                    }`}
                />
            ))}
        </div>
    );
}

export function AIPanel({ onClose, onInsertShapes, onAddToLibrary, usageInfo, isUnlimited }) {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState('auto');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedShapes, setGeneratedShapes] = useState(null);
    const [generatedLabel, setGeneratedLabel] = useState('');

    const used = usageInfo && !isUnlimited ? (DAILY_LIMIT - usageInfo.remaining) : 0;
    const currentType = DIAGRAM_TYPES.find(t => t.id === selectedType);
    const placeholder = currentType?.placeholder || DIAGRAM_TYPES[0].placeholder;

    // Reset preview when type changes
    useEffect(() => {
        setGeneratedShapes(null);
        setGeneratedLabel('');
    }, [selectedType]);

    const handleGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setGeneratedShapes(null);
        setGeneratedLabel('');

        try {
            const aiService = getAIService();
            let intent;

            // Type-forced: bypass intent classifier and call generator directly
            if (selectedType !== 'auto') {
                switch (selectedType) {
                    case 'chart':
                        intent = await aiService.getChartJSON(prompt);
                        break;
                    case 'erd':
                        intent = await aiService.getERDJSON(prompt);
                        break;
                    case 'mindmap':
                        intent = await aiService.getMindMapJSON(prompt);
                        break;
                    case 'dsa':
                        intent = await aiService.getDSAGraphJSON(prompt);
                        break;
                    case 'comparison':
                        intent = await aiService.getComparisonJSON(prompt);
                        break;
                    case 'flowchart': {
                        intent = await aiService.getFlowchartJSON(prompt);
                        break;
                    }
                    default:
                        intent = await aiService.generateGraphJSON(prompt);
                }
            } else {
                intent = await aiService.generateGraphJSON(prompt);
            }

            // Shape generation
            let shapes = null;
            let label = 'AI Diagram';

            if (intent.intent_type === 'non_visual') {
                toast.info(intent.suggestion || 'This prompt is not visual. Try describing a diagram.');
                setIsGenerating(false);
                return;
            } else if (intent.intent_type === 'comparison') {
                shapes = generateComparisonShapes(intent);
                label = 'AI Comparison';
            } else if (intent.intent_type === 'chart') {
                shapes = generateChartShapes(intent);
                label = 'AI Chart';
            } else if (intent.intent_type === 'erd') {
                shapes = generateERDShapes(intent);
                label = 'AI ERD';
            } else if (intent.intent_type === 'mindmap') {
                shapes = generateMindMapShapes(intent);
                label = 'AI Mind Map';
            } else if (intent.intent_type === 'dsa') {
                shapes = generateDSAShapes(intent);
                label = 'AI DSA Diagram';
            } else if (intent.intent_type === 'diagram') {
                const isExplanation = intent.graph?.diagramMode === 'explanation';
                if (!isExplanation) {
                    const validation = validateGraph(intent.graph);
                    if (!validation.success) {
                        toast.error('AI returned an invalid diagram format. Please try again.');
                        setIsGenerating(false);
                        return;
                    }
                }
                shapes = generateDiagramShapes(intent);
                label = 'AI Diagram';
            }

            if (shapes?.length) {
                setGeneratedShapes(shapes);
                setGeneratedLabel(label);
            } else {
                toast.error('Could not render the diagram. Please try a different prompt.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Generation failed: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsert = () => {
        if (!generatedShapes) return;
        onInsertShapes(generatedShapes);
        onClose();
    };

    const handleAddToLibrary = () => {
        if (!generatedShapes || !onAddToLibrary) return;
        const name = prompt.slice(0, 40) || generatedLabel;
        try {
            onAddToLibrary(generatedShapes, name);
            toast.success('Added to library!');
        } catch (err) {
            toast.error('Failed to add to library.');
        }
    };

    return (
        <div className="flex flex-col gap-3 w-[420px] bg-white/97 backdrop-blur-xl border border-neutral-200/70 rounded-2xl shadow-2xl overflow-hidden">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[14px] font-semibold text-neutral-900">Generate Diagram</span>
                </div>
                <div className="flex items-center gap-3">
                    {usageInfo && !isUnlimited && (
                        <div className="flex items-center gap-1.5">
                            <UsageDots used={used} />
                            <span className="text-[10px] text-neutral-400 font-medium">{usageInfo.remaining} left</span>
                        </div>
                    )}
                    {isUnlimited && (
                        <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            Unlimited
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 px-4 pb-4">

                {/* ── Type chips ──────────────────────────────────────── */}
                <div>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Diagram Type</p>
                    <DiagramTypeChips selected={selectedType} onChange={setSelectedType} />
                </div>

                {/* ── Prompt input ─────────────────────────────────────── */}
                <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    onSubmit={handleGenerate}
                    isGenerating={isGenerating}
                    placeholder={placeholder}
                />

                {/* ── Preview ─────────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                            Preview
                            {generatedShapes && !isGenerating && (
                                <span className="ml-1.5 text-indigo-400 normal-case tracking-normal font-medium">
                                    · {generatedShapes.length} shapes
                                </span>
                            )}
                        </p>
                        {/* Regenerate button — visible once a diagram exists */}
                        {generatedShapes && (
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium
                                    text-indigo-600 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300
                                    disabled:opacity-40 disabled:pointer-events-none transition-all"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Regenerate
                            </button>
                        )}
                    </div>
                    <DiagramPreview shapes={generatedShapes} isGenerating={isGenerating} />
                </div>

                {/* ── Actions ─────────────────────────────────────────── */}
                <div className="flex gap-2">
                    <button
                        onClick={handleAddToLibrary}
                        disabled={!generatedShapes || !onAddToLibrary}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12px] font-medium
                            border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40
                            disabled:pointer-events-none transition-colors"
                    >
                        <BookMarked className="w-3.5 h-3.5" />
                        Add to Library
                    </button>
                    <button
                        onClick={handleInsert}
                        disabled={!generatedShapes}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12px] font-medium
                            bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40
                            disabled:pointer-events-none transition-colors shadow-sm"
                    >
                        Insert on Canvas
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Upgrade hint ─────────────────────────────────────── */}
                {usageInfo && !isUnlimited && (
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-neutral-400">
                            {usageInfo.remaining} of {DAILY_LIMIT} daily prompts · resets midnight
                        </span>
                        <button
                            onClick={() => { onClose(); navigate('/dashboard/settings'); }}
                            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                        >
                            Add API key →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
