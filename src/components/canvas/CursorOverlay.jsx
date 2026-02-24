import { MousePointer2 } from "lucide-react";
import { useEffect, useState } from "react";

function LiveCursor({ cursor, viewport }) {
    const [opacity, setOpacity] = useState(1);

    // Fade out after 3 seconds of inactivity
    useEffect(() => {
        setOpacity(1); // Wake up on movement
        const t = setTimeout(() => setOpacity(0), 3000); // 3 seconds idle
        return () => clearTimeout(t);
    }, [cursor.x, cursor.y]);

    // Transform world coordinates to screen coordinates
    const screenX = cursor.x * viewport.zoom + viewport.x;
    const screenY = cursor.y * viewport.zoom + viewport.y;

    return (
        <div
            className="absolute flex flex-col items-start transition-all ease-out"
            style={{
                left: 0,
                top: 0,
                transform: `translate(${screenX}px, ${screenY}px)`,
                opacity: opacity,
                // Fast transition for movement (75ms), slow transition for fade out (500ms)
                transitionDuration: opacity === 1 ? '75ms' : '500ms',
                zIndex: opacity === 1 ? 50 : 40 // Push idle cursors back
            }}
        >
            <MousePointer2
                className="w-5 h-5 fill-current drop-shadow-md"
                style={{ color: cursor.color || '#3b82f6' }}
            />
            <div
                className="px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap font-bold text-white shadow-sm ml-4 -mt-2"
                style={{ backgroundColor: cursor.color || '#3b82f6' }}
            >
                {cursor.displayName || 'Guest'}
            </div>
        </div>
    );
}

export function CursorOverlay({ cursors = [], viewport = { x: 0, y: 0, zoom: 1 } }) {
    if (!cursors.length) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {cursors.map((cursor) => (
                <LiveCursor key={cursor.userId} cursor={cursor} viewport={viewport} />
            ))}
        </div>
    );
}
