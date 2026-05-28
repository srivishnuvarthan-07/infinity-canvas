export const FEATURED_SHAPES = [
    {
        id: "feat-sticky",
        name: "Sticky Note",
        shapes: [
            {
                id: "fs-1", type: "rectangle", position: { x: 0, y: 0 }, size: { width: 140, height: 140 },
                style: { fill: "#fef08a", stroke: "transparent", strokeWidth: 0, roughness: 1.5 }
            },
            {
                id: "fs-2", type: "text", text: "Note", position: { x: 40, y: 55 }, size: { width: 60, height: 20 },
                font: { size: 24, family: "Caveat", align: "center" }, style: { fill: "#1f2937" }
            }
        ]
    },
    {
        id: "feat-process",
        name: "Process Node",
        shapes: [
            {
                id: "fp-1", type: "rectangle", position: { x: 0, y: 0 }, size: { width: 140, height: 60 },
                style: { fill: "#e0f2fe", stroke: "#0ea5e9", strokeWidth: 2, roughness: 1.5 }
            },
            {
                id: "fp-2", type: "text", text: "Process", position: { x: 30, y: 15 }, size: { width: 80, height: 20 },
                font: { size: 18, family: "Arial", align: "center", weight: "600" }, style: { fill: "#0369a1" }
            }
        ]
    },
    {
        id: "feat-decision",
        name: "Decision Node",
        shapes: [
            {
                id: "fd-1", type: "diamond", position: { x: 0, y: 0 }, size: { width: 100, height: 100 },
                style: { fill: "#e9d5ff", stroke: "#a855f7", strokeWidth: 2, roughness: 1.5 }
            },
            {
                id: "fd-2", type: "text", text: "Yes/No", position: { x: 15, y: 35 }, size: { width: 70, height: 20 },
                font: { size: 16, family: "Arial", align: "center", weight: "600" }, style: { fill: "#7e22ce" }
            }
        ]
    },
    {
        id: "feat-terminal",
        name: "Start / End",
        shapes: [
            {
                id: "ft-1", type: "ellipse", position: { x: 0, y: 0 }, size: { width: 120, height: 50 },
                style: { fill: "#dcfce7", stroke: "#22c55e", strokeWidth: 2, roughness: 1.5 }
            },
            {
                id: "ft-2", type: "text", text: "Start", position: { x: 35, y: 12 }, size: { width: 50, height: 20 },
                font: { size: 18, family: "Arial", align: "center", weight: "bold" }, style: { fill: "#15803d" }
            }
        ]
    },
    {
        id: "feat-database",
        name: "Database",
        shapes: [
            {
                id: "fdb-1", type: "cylinder", position: { x: 0, y: 0 }, size: { width: 80, height: 100 },
                style: { fill: "#ffedd5", stroke: "#f97316", strokeWidth: 2, roughness: 1.5 }
            },
            {
                id: "fdb-2", type: "text", text: "DB", position: { x: 25, y: 40 }, size: { width: 30, height: 20 },
                font: { size: 18, family: "Arial", align: "center", weight: "bold" }, style: { fill: "#c2410c" }
            }
        ]
    },
    {
        id: "feat-document",
        name: "Document",
        shapes: [
            {
                id: "fdoc-1", type: "document", position: { x: 0, y: 0 }, size: { width: 80, height: 100 },
                style: { fill: "#f1f5f9", stroke: "#64748b", strokeWidth: 2, roughness: 1.5 }
            },
            {
                id: "fdoc-2", type: "text", text: "Doc", position: { x: 22, y: 35 }, size: { width: 40, height: 20 },
                font: { size: 16, family: "Arial", align: "center", weight: "600" }, style: { fill: "#334155" }
            }
        ]
    },
    {
        id: "feat-cloud",
        name: "Cloud Network",
        shapes: [
            {
                id: "fc-1", type: "ellipse", position: { x: 20, y: 0 }, size: { width: 60, height: 40 },
                style: { fill: "#e0f2fe", stroke: "#0ea5e9", strokeWidth: 2 }
            },
            {
                id: "fc-2", type: "ellipse", position: { x: 0, y: 20 }, size: { width: 50, height: 40 },
                style: { fill: "#e0f2fe", stroke: "#0ea5e9", strokeWidth: 2 }
            },
            {
                id: "fc-3", type: "ellipse", position: { x: 50, y: 20 }, size: { width: 60, height: 40 },
                style: { fill: "#e0f2fe", stroke: "#0ea5e9", strokeWidth: 2 }
            },
            {
                id: "fc-4", type: "ellipse", position: { x: 25, y: 30 }, size: { width: 60, height: 30 },
                style: { fill: "#e0f2fe", stroke: "#0ea5e9", strokeWidth: 2 }
            }
        ]
    },
    {
        id: "feat-user",
        name: "User / Actor",
        shapes: [
            {
                id: "fu-1", type: "ellipse", position: { x: 20, y: 0 }, size: { width: 40, height: 40 },
                style: { fill: "#f1f5f9", stroke: "#475569", strokeWidth: 2 }
            },
            {
                id: "fu-2", type: "line", position: { x: 40, y: 40 }, points: [{x:0, y:0}, {x:0, y:40}],
                style: { stroke: "#475569", strokeWidth: 2 }
            },
            {
                id: "fu-3", type: "line", position: { x: 15, y: 50 }, points: [{x:0, y:0}, {x:50, y:0}],
                style: { stroke: "#475569", strokeWidth: 2 }
            },
            {
                id: "fu-4", type: "line", position: { x: 40, y: 80 }, points: [{x:0, y:0}, {x:-20, y:30}],
                style: { stroke: "#475569", strokeWidth: 2 }
            },
            {
                id: "fu-5", type: "line", position: { x: 40, y: 80 }, points: [{x:0, y:0}, {x:20, y:30}],
                style: { stroke: "#475569", strokeWidth: 2 }
            }
        ]
    },
    {
        id: "feat-component",
        name: "Component",
        shapes: [
            {
                id: "fcomp-1", type: "rectangle", position: { x: 10, y: 0 }, size: { width: 120, height: 80 },
                style: { fill: "#f3e8ff", stroke: "#9333ea", strokeWidth: 2 }
            },
            {
                id: "fcomp-2", type: "rectangle", position: { x: 0, y: 20 }, size: { width: 20, height: 15 },
                style: { fill: "#f3e8ff", stroke: "#9333ea", strokeWidth: 2 }
            },
            {
                id: "fcomp-3", type: "rectangle", position: { x: 0, y: 45 }, size: { width: 20, height: 15 },
                style: { fill: "#f3e8ff", stroke: "#9333ea", strokeWidth: 2 }
            },
            {
                id: "fcomp-4", type: "text", text: "Component", position: { x: 30, y: 30 }, size: { width: 90, height: 20 },
                font: { size: 14, family: "Arial", align: "center", weight: "600" }, style: { fill: "#7e22ce" }
            }
        ]
    },
    {
        id: "feat-data-flow",
        name: "Data Flow Arrow",
        shapes: [
            {
                id: "fdf-1", type: "arrow", position: { x: 0, y: 0 }, points: [{x:0, y:0}, {x:100, y:0}],
                arrow: { startHead: "none", endHead: "triangle" },
                style: { stroke: "#3b82f6", strokeWidth: 3, roughness: 1.5 }
            }
        ]
    },
    {
        id: "feat-bi-dir",
        name: "Bi-directional",
        shapes: [
            {
                id: "fb-1", type: "arrow", position: { x: 0, y: 0 }, points: [{x:0, y:0}, {x:100, y:0}],
                arrow: { startHead: "triangle", endHead: "triangle" },
                style: { stroke: "#64748b", strokeWidth: 2, roughness: 1.5 }
            }
        ]
    },
    {
        id: "feat-text-block",
        name: "Text Heading",
        shapes: [
            {
                id: "ftxt-1", type: "text", text: "Heading 1", position: { x: 0, y: 0 }, size: { width: 150, height: 40 },
                font: { size: 32, family: "Arial", align: "left", weight: "bold" }, style: { fill: "#0f172a" }
            }
        ]
    }
];
