import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onZoomReset }) {
  return (
    <div className="toolbar-container animate-slide-up">
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="zoom-button" onClick={onZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom Out</TooltipContent>
      </Tooltip>

      <button
        className="px-2 min-w-[60px] text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={onZoomReset}
      >
        {Math.round(zoom * 100)}%
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <button className="zoom-button" onClick={onZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button className="zoom-button ml-1" onClick={onZoomReset}>
            <Maximize2 className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Fit to Screen</TooltipContent>
      </Tooltip>
    </div>
  );
}
