import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sparkles } from 'lucide-react';
export function Logo() {
    return (_jsxs("div", { className: "flex items-center gap-2 animate-fade-in", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-button", children: _jsx(Sparkles, { className: "w-5 h-5 text-primary-foreground" }) }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-lg font-semibold text-foreground leading-tight", children: "SketchFlow" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Collaborative Canvas" })] })] }));
}
