import { DRAWING_COLORS } from "@/types/canvas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ColorPicker({ activeColor, onColorChange }) {
  return (
    <div className="toolbar-container animate-fade-in">
      <div className="flex items-center gap-1.5 px-1">
        {DRAWING_COLORS.map((color) => (
          <Tooltip key={color.name}>
            <TooltipTrigger asChild>
              <button
                className={`color-swatch ${activeColor === color.value ? "active" : ""}`}
                style={{ backgroundColor: color.value }}
                onClick={() => onColorChange(color.value)}
              />
            </TooltipTrigger>

            <TooltipContent side="bottom">{color.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
