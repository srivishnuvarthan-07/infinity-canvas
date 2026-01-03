import {
  MousePointer2,
  Hand,
  Pencil,
  Minus,
  ArrowUpRight,
  Square,
  Diamond,
  Circle,
  Type,
  Eraser,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const tools = [
  { type: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { type: "hand", icon: Hand, label: "Pan", shortcut: "H" },
  { type: "draw", icon: Pencil, label: "Pencil", shortcut: "P" },
  { type: "line", icon: Minus, label: "Line", shortcut: "L" },
  { type: "arrow", icon: ArrowUpRight, label: "Arrow", shortcut: "A" },
  { type: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { type: "diamond", icon: Diamond, label: "Diamond", shortcut: "D" },
  { type: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  { type: "text", icon: Type, label: "Text", shortcut: "T" },
  { type: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

export function Toolbar({ activeTool, onToolChange }) {
  return (
    <div className="toolbar-container animate-fade-in">
      {tools.map((tool) => (
        <Tooltip key={tool.type}>
          <TooltipTrigger asChild>
            <button
              className={`tool-button ${activeTool === tool.type ? "active" : ""}`}
              onClick={() => onToolChange(tool.type)}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          </TooltipTrigger>

          <TooltipContent side="bottom" className="flex items-center gap-2">
            <span>{tool.label}</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
              {tool.shortcut}
            </kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
