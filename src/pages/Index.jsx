import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { Helmet } from 'react-helmet-async';
const Index = () => {
    return (_jsxs(_Fragment, { children: [_jsxs(Helmet, { children: [_jsx("title", { children: "SketchFlow - Collaborative Drawing Canvas" }), _jsx("meta", { name: "description", content: "Create beautiful diagrams and sketches with SketchFlow, a collaborative whiteboard for teams and individuals." })] }), _jsx(DrawingCanvas, {})] }));
};
export default Index;
