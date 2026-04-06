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
  Image as ImageIcon,
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
  { type: "image", icon: ImageIcon, label: "Image", shortcut: "I" },
  { type: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

export function Toolbar({ activeTool, onToolChange, orientation = "horizontal" }) {
  const isVertical = orientation === "vertical";

  return (
    <div className={`
        flex ${isVertical ? "flex-col" : "flex-row"} 
        gap-2 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-2xl border border-neutral-200/50
        transition-all duration-300 hover:scale-105 hover:bg-white/90
    `}>
      {tools.map((tool) => (
        <Tooltip key={tool.type}>
          <TooltipTrigger asChild>
            <button
              className={`
                flex items-center justify-center rounded-lg p-2.5 transition-all duration-200
                ${activeTool === tool.type
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }
              `}
              onClick={() => onToolChange(tool.type)}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          </TooltipTrigger>

          <TooltipContent side={isVertical ? "right" : "bottom"} className="flex items-center gap-2">
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
