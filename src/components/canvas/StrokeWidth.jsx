import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { STROKE_WIDTHS } from '@/types/canvas';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
export function StrokeWidth({ activeWidth, onWidthChange }) {
    return (_jsx("div", { className: "toolbar-container animate-fade-in", children: _jsx("div", { className: "flex items-center gap-1 px-1", children: STROKE_WIDTHS.map((width) => (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { className: `tool-button ${activeWidth === width ? 'active' : ''}`, onClick: () => onWidthChange(width), children: _jsx("div", { className: "rounded-full bg-current", style: {
                                    width: Math.min(width * 2 + 4, 20),
                                    height: Math.min(width * 2 + 4, 20)
                                } }) }) }), _jsxs(TooltipContent, { side: "bottom", children: [width, "px"] })] }, width))) }) }));
}
