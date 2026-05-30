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

const toolGroups = [
  [
    { type: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
    { type: "hand", icon: Hand, label: "Pan", shortcut: "H" },
  ],
  [
    { type: "draw", icon: Pencil, label: "Pencil", shortcut: "P" },
    { type: "line", icon: Minus, label: "Line", shortcut: "L" },
    { type: "arrow", icon: ArrowUpRight, label: "Arrow", shortcut: "A" },
    { type: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
    { type: "diamond", icon: Diamond, label: "Diamond", shortcut: "D" },
    { type: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  ],
  [
    { type: "text", icon: Type, label: "Text", shortcut: "T" },
    { type: "image", icon: ImageIcon, label: "Image", shortcut: "I" },
    { type: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
  ],
];

export function Toolbar({ activeTool, onToolChange, orientation = "horizontal" }) {
  const isVertical = orientation === "vertical";

  return (
    <div className={`
        flex ${isVertical ? "flex-col" : "flex-row"} items-center
        gap-0.5 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-full shadow-xl border border-neutral-200/50
        transition-all duration-300 hover:bg-white hover:shadow-2xl
    `}>
      {toolGroups.map((group, groupIndex) => (
        <div key={groupIndex} className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center gap-0.5`}>
          {groupIndex > 0 && (
            <div className={isVertical ? "w-4 h-px bg-neutral-200/80 my-0.5 mx-auto" : "h-4 w-px bg-neutral-200/80 mx-1"} />
          )}
          {group.map((tool) => (
            <Tooltip key={tool.type}>
              <TooltipTrigger asChild>
                <button
                  className={`
                    flex items-center justify-center rounded-full w-8 h-8 transition-all duration-150
                    ${activeTool === tool.type
                      ? "bg-indigo-600 text-white shadow-md scale-105"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                    }
                  `}
                  onClick={() => onToolChange(tool.type)}
                >
                  <tool.icon className="w-4 h-4" />
                </button>
              </TooltipTrigger>

              <TooltipContent side={isVertical ? "right" : "top"} className="flex items-center gap-2">
                <span>{tool.label}</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
                  {tool.shortcut}
                </kbd>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );
}
