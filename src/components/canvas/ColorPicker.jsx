import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DRAWING_COLORS } from '@/types/canvas';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
export function ColorPicker({ activeColor, onColorChange }) {
    return (_jsx("div", { className: "toolbar-container animate-fade-in", children: _jsx("div", { className: "flex items-center gap-1.5 px-1", children: DRAWING_COLORS.map((color) => (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { className: `color-swatch ${activeColor === color.value ? 'active' : ''}`, style: { backgroundColor: color.value }, onClick: () => onColorChange(color.value) }) }), _jsx(TooltipContent, { side: "bottom", children: color.name })] }, color.name))) }) }));
}
