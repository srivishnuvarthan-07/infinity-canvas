import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ZoomControls({ zoom, onZoomIn, onZoomOut, onZoomReset }) {
  return (
    <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-md border border-neutral-200/50 rounded-full shadow-lg px-1.5 py-1 transition-all hover:bg-white hover:shadow-xl">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-all duration-150 active:scale-90"
            onClick={onZoomOut}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="px-2 min-w-[48px] text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full h-7 transition-all duration-150"
            onClick={onZoomReset}
          >
            {Math.round(zoom * 100)}%
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Reset Zoom</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-all duration-150 active:scale-90"
            onClick={onZoomIn}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom In</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-neutral-200 mx-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-all duration-150 active:scale-90"
            onClick={onZoomReset}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Fit to Screen</TooltipContent>
      </Tooltip>
    </div>
  );
}
