import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MousePointer2, Hand, Pencil, Minus, ArrowUpRight, Square, Diamond, Circle, Type, Eraser } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
const tools = [
    { type: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { type: 'hand', icon: Hand, label: 'Pan', shortcut: 'H' },
    { type: 'draw', icon: Pencil, label: 'Pencil', shortcut: 'P' },
    { type: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
    { type: 'arrow', icon: ArrowUpRight, label: 'Arrow', shortcut: 'A' },
    { type: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { type: 'diamond', icon: Diamond, label: 'Diamond', shortcut: 'D' },
    { type: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
    { type: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { type: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
];
export function Toolbar({ activeTool, onToolChange }) {
    return (_jsx("div", { className: "toolbar-container animate-fade-in", children: tools.map((tool) => (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { className: `tool-button ${activeTool === tool.type ? 'active' : ''}`, onClick: () => onToolChange(tool.type), children: _jsx(tool.icon, { className: "w-5 h-5" }) }) }), _jsxs(TooltipContent, { side: "bottom", className: "flex items-center gap-2", children: [_jsx("span", { children: tool.label }), _jsx("kbd", { className: "px-1.5 py-0.5 text-xs bg-muted rounded font-mono", children: tool.shortcut })] })] }, tool.type))) }));
}
