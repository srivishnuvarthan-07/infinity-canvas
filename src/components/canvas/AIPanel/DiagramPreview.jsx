import { useEffect, useRef, useCallback } from 'react';
import { CanvasRenderer } from '@/engine/render/CanvasRenderer';

const PREVIEW_W = 388;
const PREVIEW_H = 220;
const PADDING = 32;

/** Compute a viewport that fits all shapes into the preview canvas */
function fitViewport(shapes, canvasW, canvasH) {
    if (!shapes || shapes.length === 0) return { x: canvasW / 2, y: canvasH / 2, zoom: 1 };

    const allShapes = [];
    const flatten = (s) => {
        allShapes.push(s);
        if (s.children) s.children.forEach(flatten);
    };
    shapes.forEach(flatten);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allShapes.forEach(s => {
        const px = s.position?.x || 0;
        const py = s.position?.y || 0;
        const hw = (s.size?.width || 0) / 2;
        const hh = (s.size?.height || 0) / 2;
        if (s.points && s.points.length > 0) {
            s.points.forEach(p => {
                minX = Math.min(minX, px + p.x);
                maxX = Math.max(maxX, px + p.x);
                minY = Math.min(minY, py + p.y);
                maxY = Math.max(maxY, py + p.y);
            });
        } else {
            minX = Math.min(minX, px - hw);
            maxX = Math.max(maxX, px + hw);
            minY = Math.min(minY, py - hh);
            maxY = Math.max(maxY, py + hh);
        }
    });

    if (!isFinite(minX)) return { x: canvasW / 2, y: canvasH / 2, zoom: 1 };

    const contentW = maxX - minX || 1;
    const contentH = maxY - minY || 1;
    const zoom = Math.min(
        (canvasW - PADDING * 2) / contentW,
        (canvasH - PADDING * 2) / contentH,
        2
    );
    const cx = minX + contentW / 2;
    const cy = minY + contentH / 2;
    return {
        x: canvasW / 2 - cx * zoom,
        y: canvasH / 2 - cy * zoom,
        zoom,
    };
}

export function DiagramPreview({ shapes, isGenerating }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

    // Canvas ref callback — fires whenever the element is actually in the DOM
    const initCanvas = useCallback((canvas) => {
        canvasRef.current = canvas;
        if (!canvas) { rendererRef.current = null; return; }

        const dpr = window.devicePixelRatio || 1;
        canvas.width = PREVIEW_W * dpr;
        canvas.height = PREVIEW_H * dpr;
        canvas.style.width = `${PREVIEW_W}px`;
        canvas.style.height = `${PREVIEW_H}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const renderer = new CanvasRenderer(canvas);
        renderer.width = PREVIEW_W;
        renderer.height = PREVIEW_H;
        rendererRef.current = renderer;
    }, []);

    // Re-render whenever shapes change
    useEffect(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;
        if (!shapes || shapes.length === 0) {
            renderer.clear();
            return;
        }
        const viewport = fitViewport(shapes, PREVIEW_W, PREVIEW_H);
        renderer.render(shapes, {}, viewport);
    }, [shapes]);

    const isEmpty  = !shapes && !isGenerating;
    const isLoading = isGenerating;
    const hasShapes = !isGenerating && shapes && shapes.length > 0;

    return (
        <div
            className="relative rounded-xl border border-neutral-200 overflow-hidden bg-white"
            style={{ width: PREVIEW_W, height: PREVIEW_H }}
        >
            {/* Canvas — always in DOM so initCanvas fires on mount */}
            <canvas
                ref={initCanvas}
                className="absolute inset-0 block"
                style={{ opacity: hasShapes ? 1 : 0, transition: 'opacity 0.2s' }}
            />

            {/* ── Empty state overlay ──────────────────────────────── */}
            {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400 select-none bg-neutral-50/80">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                    <p className="text-[12px] font-medium text-neutral-500">Diagram preview</p>
                    <p className="text-[11px] text-neutral-400">Type a prompt above and generate</p>
                </div>
            )}

            {/* ── Generating skeleton overlay ──────────────────────── */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col justify-center gap-2.5 px-6 bg-white">
                    {[65, 45, 80, 35, 55, 70].map((w, i) => (
                        <div
                            key={i}
                            className="rounded-lg bg-indigo-100 animate-pulse"
                            style={{ width: `${w}%`, height: 14, animationDelay: `${i * 70}ms` }}
                        />
                    ))}
                    <p className="text-[11px] text-indigo-400 font-semibold text-center mt-1 animate-pulse">
                        Generating…
                    </p>
                </div>
            )}
        </div>
    );
}
