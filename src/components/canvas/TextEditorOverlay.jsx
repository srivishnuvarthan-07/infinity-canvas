import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { getTextLayout } from '@/engine/utils/textUtils';

// Singleton temp canvas for measurement
const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');

export function TextEditorOverlay({ shape, canvasRef, updateShape, onBlur, viewport }) {
    const textareaRef = useRef(null);
    const [value, setValue] = useState(shape.text || '');

    // Canonical Layout Calculation
    // We treat the shape as if it has the CURRENT value (for growing)
    const currentShape = { ...shape, text: value };
    const layout = getTextLayout(tempCtx, currentShape);

    // Viewport Transform
    const zoom = viewport ? viewport.zoom : 1;
    const viewX = viewport ? viewport.x : 0;
    const viewY = viewport ? viewport.y : 0;

    // Determine final screen coordinates
    const screenX = (shape.position.x + layout.offsetX) * zoom + viewX;
    const screenY = (shape.position.y + layout.offsetY) * zoom + viewY;
    const screenWidth = layout.width * zoom;
    const screenHeight = layout.height * zoom;
    const screenFontSize = shape.font.size * zoom;

    // Style — no visible border, completely transparent
    const style = {
        position: 'absolute',
        top: screenY + 'px',
        left: screenX + 'px',
        width: Math.max(screenWidth, 120) + 'px',
        minWidth: '120px',
        height: Math.max(screenHeight, screenFontSize * 1.4) + 'px',
        minHeight: (screenFontSize * 1.4) + 'px',
        textAlign: shape.font?.align || 'left',
        font: `${shape.font?.weight || 'normal'} ${screenFontSize}px '${shape.font?.family || 'Caveat'}', cursive`,
        color: shape.style?.stroke || '#1a1a1a',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre',
        padding: 0,
        margin: 0,
        lineHeight: 1.25,
        zIndex: 1000,
        caretColor: shape.style?.stroke || '#1a1a1a',
    };

    // Ensure Caveat font is loaded
    useEffect(() => {
        if (!document.getElementById('caveat-font')) {
            const link = document.createElement('link');
            link.id = 'caveat-font';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap';
            document.head.appendChild(link);
        }
    }, []);

    // Focus on mount — place cursor at end, no selection
    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, [shape.id]);

    const handleChange = (e) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        if (!value.trim()) {
            // Empty text — discard shape entirely
            onBlur(true); // pass true = delete empty
            return;
        }
        // Commit changes using canonical layout
        const tempShape = { ...shape, text: value };
        const finalLayout = getTextLayout(tempCtx, tempShape);

        updateShape(shape.id, {
            text: value,
            size: {
                width: finalLayout.width,
                height: finalLayout.height
            }
        });

        onBlur();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onBlur();
        }
        if (e.key === 'Enter' && e.ctrlKey) {
            handleBlur();
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()} // Prevent canvas interaction
            style={style}
            spellCheck="false"
            autoFocus
        />
    );
}
