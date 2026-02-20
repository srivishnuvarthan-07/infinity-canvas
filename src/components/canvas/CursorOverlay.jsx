import { MousePointer2 } from "lucide-react";
import { useMemo } from "react";

// Mock cursors data
const MOCK_CURSORS = [
    { id: 1, x: 200, y: 150, name: "Alice", color: "#ef4444" }, // Red
    { id: 2, x: 800, y: 400, name: "Bob", color: "#3b82f6" },   // Blue
    { id: 3, x: 500, y: 300, name: "Charlie", color: "#22c55e" } // Green
];

export function CursorOverlay({ scale = 1, offset = { x: 0, y: 0 } }) {
    // In a real app, we'd subscribe to a websocket or store for cursor/presence data
    // and transform coordinates based on the current canvas viewport (pan/zoom).

    // For now, we'll just display them at absolute positions to simulate the UI.
    // In a real implementation, we would subtract the screen offset and multiply by scale
    // to keep them "pinned" to the canvas world coordinates.

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {MOCK_CURSORS.map((cursor) => (
                <div
                    key={cursor.id}
                    className="absolute transition-all duration-100 ease-linear flex flex-col items-start"
                    style={{
                        left: cursor.x, // + offset.x (if we had viewport integration)
                        top: cursor.y,  // + offset.y
                        transform: `translate(0, 0)`, // simple mock
                    }}
                >
                    <MousePointer2
                        className="w-5 h-5 fill-current"
                        style={{ color: cursor.color }}
                    />
                    <div
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm ml-4 -mt-2"
                        style={{ backgroundColor: cursor.color }}
                    >
                        {cursor.name}
                    </div>
                </div>
            ))}
        </div>
    );
}
