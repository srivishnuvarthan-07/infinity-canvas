import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, StopCircle, X, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SequenceAnimator } from '../../canvas/utils/sequenceAnimator';
import { GifExporter } from '../../canvas/utils/gifExporter';
import { useToast } from "@/hooks/use-toast";

export const AnimationToolbar = ({ canvasInstance, history, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [animator, setAnimator] = useState(null);
    const [playbackIndex, setPlaybackIndex] = useState(0); // Track current frame
    const { toast } = useToast();

    // Auto-play on mount
    useEffect(() => {
        handlePlay();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePlay = async () => {
        if (!canvasInstance || !history || history.length < 2) return;

        // Reset to start if at end or if we just mounted
        const startIdx = 0; // Always start from beginning for "Play" unless we implement resume

        const newAnimator = new SequenceAnimator(canvasInstance, history);
        setAnimator(newAnimator);
        setIsPlaying(true);
        setPlaybackIndex(0);

        try {
            await newAnimator.play(startIdx);
        } finally {
            setIsPlaying(false);
            setAnimator(null);
            setPlaybackIndex(history.length - 1); // Assume finished
        }
    };

    const handleStep = async () => {
        if (!canvasInstance || !history || history.length < 2) return;
        if (playbackIndex >= history.length - 1) return;

        const newAnimator = new SequenceAnimator(canvasInstance, history);
        setIsPlaying(true);

        try {
            // Ensure we are at the visual state of 'playbackIndex'
            // For robustness, we could force load:
            if (playbackIndex === 0) {
                const startState = JSON.parse(history[0]);
                await new Promise(resolve => canvasInstance.loadFromJSON(startState, resolve));
                canvasInstance.requestRenderAll();
            }

            // Step Forward
            await newAnimator.step(playbackIndex);
            setPlaybackIndex(prev => prev + 1);
        } finally {
            setIsPlaying(false);
        }
    };

    const handleStop = () => {
        if (animator) {
            animator.stop();
            setIsPlaying(false);
        }
    };

    const handleExport = async () => {
        if (!canvasInstance || !history || history.length < 2) return;

        setIsExporting(true);
        toast({ title: "Exporting GIF...", description: "Rendering frames. This may take a moment." });

        try {
            const exporter = new GifExporter(canvasInstance, history);
            const blob = await exporter.export({ width: 800, delay: 500, fps: 20 });

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animation-${Date.now()}.gif`;
            a.click();
            URL.revokeObjectURL(url);

            toast({ title: "Export Complete", description: "GIF downloaded successfully." });
        } catch (e) {
            console.error(e);
            toast({ title: "Export Failed", description: "Could not generate GIF.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    const isDisabled = !history || history.length < 2;

    return (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white border shadow-md rounded-full px-4 py-2 flex items-center gap-2 z-50 pointer-events-auto">
            {!isPlaying ? (
                <Button variant="ghost" size="icon" onClick={handlePlay} disabled={isExporting || isDisabled}>
                    <Play className="h-5 w-5 fill-current" />
                </Button>
            ) : (
                <Button variant="ghost" size="icon" onClick={handleStop}>
                    <StopCircle className="h-5 w-5 text-red-500" />
                </Button>
            )}

            <Button variant="ghost" size="icon" onClick={handleStep} disabled={isPlaying || isExporting || isDisabled || playbackIndex >= history.length - 1}>
                <SkipForward className="h-5 w-5" />
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            <Button variant="ghost" size="sm" className="gap-2 text-xs" onClick={handleExport} disabled={isPlaying || isExporting || isDisabled}>
                <Download className="h-4 w-4" />
                {isExporting ? "Rendering..." : "GIF"}
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-900">
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};
