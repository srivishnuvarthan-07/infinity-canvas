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

    // Style
    const style = {
        position: 'absolute',
        // Exact positioning based on canonical layout
        top: screenY + 'px',
        left: screenX + 'px',
        width: screenWidth + 'px',
        height: screenHeight + 'px',

        // Match internal alignment
        textAlign: shape.textAlign || 'center',

        // Font
        font: `${screenFontSize}px ${shape.font.family}`,
        color: shape.style.stroke,
        background: 'transparent',
        border: '1px dashed #3b82f6',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre',
        padding: 0,
        margin: 0,
        lineHeight: 1.25, // Match textUtils
        zIndex: 1000,
    };

    // Focus on mount
    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            // Select all
            textareaRef.current.setSelectionRange(0, textareaRef.current.value.length);
        }
    }, [shape.id]);

    const handleChange = (e) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
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
            onBlur(); // Cancel or Commit? Standard is Commit on blur.
        }
        // Shift+Enter for new line? Default behavior works.
        // Enter? Depends if we want single line default.
        // Excalidraw uses Enter for new line.
        // Ctrl+Enter to stop?
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
