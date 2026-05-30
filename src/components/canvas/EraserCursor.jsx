import React, { useEffect, useRef, useState } from 'react';

/**
 * EraserCursor
 *
 * Renders an Excalidraw-style circular pointer ball that tracks the mouse
 * whenever the eraser tool is active. The canvas cursor is set to `none`
 * (handled in useEngineInteraction) so only this overlay is visible.
 */
export function EraserCursor({ isActive, containerRef }) {
    const [pos, setPos] = useState({ x: -100, y: -100 });
    const [isPressed, setIsPressed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const rafRef = useRef(null);
    const latestPos = useRef({ x: -100, y: -100 });

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false);
            return;
        }

        const container = containerRef?.current;
        if (!container) return;

        const onMove = (e) => {
            const rect = container.getBoundingClientRect();
            latestPos.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };

            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                setPos({ ...latestPos.current });
            });

            setIsVisible(true);
        };

        const onDown = () => setIsPressed(true);
        const onUp = () => setIsPressed(false);
        const onLeave = () => setIsVisible(false);
        const onEnter = () => setIsVisible(true);

        container.addEventListener('pointermove', onMove);
        container.addEventListener('pointerdown', onDown);
        container.addEventListener('pointerup', onUp);
        container.addEventListener('pointerleave', onLeave);
        container.addEventListener('pointerenter', onEnter);

        return () => {
            container.removeEventListener('pointermove', onMove);
            container.removeEventListener('pointerdown', onDown);
            container.removeEventListener('pointerup', onUp);
            container.removeEventListener('pointerleave', onLeave);
            container.removeEventListener('pointerenter', onEnter);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isActive, containerRef]);

    if (!isActive || !isVisible) return null;

    const SIZE = isPressed ? 20 : 24;
    const HALF = SIZE / 2;

    return (
        <div
            style={{
                position: 'absolute',
                left: pos.x - HALF,
                top: pos.y - HALF,
                width: SIZE,
                height: SIZE,
                pointerEvents: 'none',
                zIndex: 9999,
                transition: 'width 80ms ease, height 80ms ease, left 0ms, top 0ms',
            }}
        >
            {/* Outer ring */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `2px solid ${isPressed ? 'rgba(99,102,241,0.9)' : 'rgba(99,102,241,0.75)'}`,
                    background: isPressed
                        ? 'rgba(99,102,241,0.18)'
                        : 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(2px)',
                    boxShadow: isPressed
                        ? '0 0 0 3px rgba(99,102,241,0.2), inset 0 1px 2px rgba(0,0,0,0.08)'
                        : '0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(99,102,241,0.12)',
                    transition: 'background 80ms ease, box-shadow 80ms ease, border-color 80ms ease',
                }}
            />
            {/* Center dot */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isPressed ? 5 : 4,
                    height: isPressed ? 5 : 4,
                    borderRadius: '50%',
                    background: isPressed ? 'rgba(99,102,241,1)' : 'rgba(99,102,241,0.7)',
                    transition: 'width 80ms ease, height 80ms ease, background 80ms ease',
                }}
            />
        </div>
    );
}
