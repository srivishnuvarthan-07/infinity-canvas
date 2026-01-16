import React, { useState } from 'react';
import { Play, Pause, Download, StopCircle, X, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SequenceAnimator } from '../../canvas/utils/sequenceAnimator';
import { GifExporter } from '../../canvas/utils/gifExporter';
import { useToast } from "@/hooks/use-toast";

export const AnimationToolbar = ({ canvasRef, history, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [animator, setAnimator] = useState(null);
    const { toast } = useToast();

    const handlePlay = async () => {
        if (!canvasRef.current || !history || history.length < 2) return;

        // Initialize Animator
        const newAnimator = new SequenceAnimator(canvasRef.current, history);
        setAnimator(newAnimator);
        setIsPlaying(true);

        try {
            await newAnimator.play();
        } finally {
            setIsPlaying(false);
            setAnimator(null);
        }
    };

    const handleStop = () => {
        if (animator) {
            animator.stop();
            setIsPlaying(false);
        }
    };

    const handleExport = async () => {
        if (!canvasRef.current || !history || history.length < 2) return;

        setIsExporting(true);
        toast({ title: "Exporting GIF...", description: "Rendering frames. This may take a moment." });

        try {
            const exporter = new GifExporter(canvasRef.current, history);
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
