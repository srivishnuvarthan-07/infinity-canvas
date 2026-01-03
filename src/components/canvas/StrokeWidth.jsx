import { STROKE_WIDTHS } from "@/types/canvas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function StrokeWidth({ activeWidth, onWidthChange }) {
  return (
    <div className="toolbar-container animate-fade-in">
      <div className="flex items-center gap-1 px-1">
        {STROKE_WIDTHS.map((width) => (
          <Tooltip key={width}>
            <TooltipTrigger asChild>
              <button
                className={`tool-button ${activeWidth === width ? "active" : ""}`}
                onClick={() => onWidthChange(width)}
              >
                <div
                  className="rounded-full bg-current"
                  style={{
                    width: Math.min(width * 2 + 4, 20),
                    height: Math.min(width * 2 + 4, 20),
                  }}
                />
              </button>
            </TooltipTrigger>

            <TooltipContent side="bottom">{width}px</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
