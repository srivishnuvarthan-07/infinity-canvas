import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Ellipse, Line, IText, PencilBrush, FabricImage } from 'fabric';
import { DRAWING_COLORS } from '@/types/canvas';
import { toast } from 'sonner';
export function useCanvas() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('select');
    const [activeColor, setActiveColor] = useState(DRAWING_COLORS[0].value);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [zoom, setZoom] = useState(1);
    const [history, setHistory] = useState({ states: [], currentIndex: -1 });
    const [isInitialized, setIsInitialized] = useState(false);
    const isDrawingShape = useRef(false);
    const shapeStart = useRef({ x: 0, y: 0 });
    const currentShape = useRef(null);
    // Save canvas state for undo/redo
    const saveState = useCallback((canvas) => {
        const json = JSON.stringify(canvas.toJSON());
        setHistory(prev => {
            const newStates = prev.states.slice(0, prev.currentIndex + 1);
            newStates.push(json);
            if (newStates.length > 50)
                newStates.shift();
            return {
                states: newStates,
                currentIndex: newStates.length - 1,
            };
        });
    }, []);
    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current)
            return;
        const container = containerRef.current;
        const canvas = new FabricCanvas(canvasRef.current, {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: 'transparent',
            selection: true,
        });
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
        setFabricCanvas(canvas);
        setIsInitialized(true);
        const handleResize = () => {
            canvas.setDimensions({
                width: container.clientWidth,
                height: container.clientHeight,
            });
            canvas.renderAll();
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.dispose();
        };
    }, []);
    // Save initial state after canvas is ready
    useEffect(() => {
        if (fabricCanvas && isInitialized) {
            saveState(fabricCanvas);
        }
    }, [fabricCanvas, isInitialized, saveState]);
    // Handle tool changes
    useEffect(() => {
        if (!fabricCanvas)
            return;
        fabricCanvas.isDrawingMode = activeTool === 'draw';
        fabricCanvas.selection = activeTool === 'select';
        if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.color = activeColor;
            fabricCanvas.freeDrawingBrush.width = strokeWidth;
        }
        const cursorMap = {
            select: 'default',
            hand: 'grab',
            draw: 'crosshair',
            line: 'crosshair',
            arrow: 'crosshair',
            rectangle: 'crosshair',
            diamond: 'crosshair',
            ellipse: 'crosshair',
            text: 'text',
            eraser: 'crosshair',
        };
        fabricCanvas.defaultCursor = cursorMap[activeTool];
        fabricCanvas.hoverCursor = activeTool === 'hand' ? 'grab' : cursorMap[activeTool];
    }, [activeTool, activeColor, strokeWidth, fabricCanvas]);
    // Handle color and stroke width changes
    useEffect(() => {
        if (!fabricCanvas || !fabricCanvas.freeDrawingBrush)
            return;
        fabricCanvas.freeDrawingBrush.color = activeColor;
        fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }, [activeColor, strokeWidth, fabricCanvas]);
    // Handle shape drawing
    useEffect(() => {
        if (!fabricCanvas)
            return;
        const handleMouseDown = (opt) => {
            if (!['rectangle', 'ellipse', 'line', 'arrow', 'diamond'].includes(activeTool))
                return;
            const pointer = fabricCanvas.getScenePoint(opt.e);
            isDrawingShape.current = true;
            shapeStart.current = { x: pointer.x, y: pointer.y };
            let shape = null;
            switch (activeTool) {
                case 'rectangle':
                    shape = new Rect({
                        left: pointer.x,
                        top: pointer.y,
                        width: 0,
                        height: 0,
                        fill: 'transparent',
                        stroke: activeColor,
                        strokeWidth: strokeWidth,
                        rx: 4,
                        ry: 4,
                    });
                    break;
                case 'ellipse':
                    shape = new Ellipse({
                        left: pointer.x,
                        top: pointer.y,
                        rx: 0,
                        ry: 0,
                        fill: 'transparent',
                        stroke: activeColor,
                        strokeWidth: strokeWidth,
                    });
                    break;
                case 'line':
                case 'arrow':
                    shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                        stroke: activeColor,
                        strokeWidth: strokeWidth,
                        strokeLineCap: 'round',
                    });
                    break;
                case 'diamond':
                    shape = new Rect({
                        left: pointer.x,
                        top: pointer.y,
                        width: 0,
                        height: 0,
                        fill: 'transparent',
                        stroke: activeColor,
                        strokeWidth: strokeWidth,
                        angle: 45,
                        originX: 'center',
                        originY: 'center',
                    });
                    break;
            }
            if (shape) {
                currentShape.current = shape;
                fabricCanvas.add(shape);
            }
        };
        const handleMouseMove = (opt) => {
            if (!isDrawingShape.current || !currentShape.current)
                return;
            const pointer = fabricCanvas.getScenePoint(opt.e);
            const { x: startX, y: startY } = shapeStart.current;
            switch (activeTool) {
                case 'rectangle':
                case 'diamond': {
                    const width = Math.abs(pointer.x - startX);
                    const height = Math.abs(pointer.y - startY);
                    currentShape.current.set({
                        width,
                        height,
                        left: activeTool === 'diamond' ? (startX + pointer.x) / 2 : Math.min(startX, pointer.x),
                        top: activeTool === 'diamond' ? (startY + pointer.y) / 2 : Math.min(startY, pointer.y),
                    });
                    break;
                }
                case 'ellipse':
                    currentShape.current.set({
                        rx: Math.abs(pointer.x - startX) / 2,
                        ry: Math.abs(pointer.y - startY) / 2,
                        left: (startX + pointer.x) / 2,
                        top: (startY + pointer.y) / 2,
                        originX: 'center',
                        originY: 'center',
                    });
                    break;
                case 'line':
                case 'arrow':
                    currentShape.current.set({
                        x2: pointer.x,
                        y2: pointer.y,
                    });
                    break;
            }
            fabricCanvas.renderAll();
        };
        const handleMouseUp = () => {
            if (isDrawingShape.current && currentShape.current) {
                if (activeTool === 'arrow') {
                    const line = currentShape.current;
                    const x1 = line.x1 || 0;
                    const y1 = line.y1 || 0;
                    const x2 = line.x2 || 0;
                    const y2 = line.y2 || 0;
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    const headLength = 15;
                    const arrowHead1 = new Line([
                        x2,
                        y2,
                        x2 - headLength * Math.cos(angle - Math.PI / 6),
                        y2 - headLength * Math.sin(angle - Math.PI / 6),
                    ], {
                        stroke: activeColor,
                        strokeWidth: strokeWidth,
                        strokeLineCap: 'round',
                    });
                    const arrowHead2 = new Line([
                        x2,
                        y2,
                        x2 - headLength * Math.cos(angle + Math.PI / 6),
                        y2 - headLength * Math.sin(angle + Math.PI / 6),
                    ], {
                        stroke: activeColor,
                        strokeWidth: strokeWidth,
                        strokeLineCap: 'round',
                    });
                    fabricCanvas.add(arrowHead1, arrowHead2);
                }
                saveState(fabricCanvas);
            }
            isDrawingShape.current = false;
            currentShape.current = null;
        };
        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:up', handleMouseUp);
        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
        };
    }, [fabricCanvas, activeTool, activeColor, strokeWidth, saveState]);
    // Handle path created (for free drawing)
    useEffect(() => {
        if (!fabricCanvas)
            return;
        const handlePathCreated = () => {
            saveState(fabricCanvas);
        };
        fabricCanvas.on('path:created', handlePathCreated);
        return () => {
            fabricCanvas.off('path:created', handlePathCreated);
        };
    }, [fabricCanvas, saveState]);
    // Handle text tool
    useEffect(() => {
        if (!fabricCanvas)
            return;
        const handleTextClick = (opt) => {
            if (activeTool !== 'text')
                return;
            const pointer = fabricCanvas.getScenePoint(opt.e);
            const text = new IText('Type here...', {
                left: pointer.x,
                top: pointer.y,
                fontSize: 20,
                fill: activeColor,
                fontFamily: 'Inter, sans-serif',
            });
            fabricCanvas.add(text);
            fabricCanvas.setActiveObject(text);
            text.enterEditing();
            text.selectAll();
            saveState(fabricCanvas);
        };
        fabricCanvas.on('mouse:down', handleTextClick);
        return () => {
            fabricCanvas.off('mouse:down', handleTextClick);
        };
    }, [fabricCanvas, activeTool, activeColor, saveState]);
    // Handle eraser
    useEffect(() => {
        if (!fabricCanvas)
            return;
        const handleEraser = (opt) => {
            if (activeTool !== 'eraser')
                return;
            const pointer = fabricCanvas.getScenePoint(opt.e);
            const objects = fabricCanvas.getObjects();
            for (const obj of objects) {
                if (obj.containsPoint(pointer)) {
                    fabricCanvas.remove(obj);
                    saveState(fabricCanvas);
                    break;
                }
            }
        };
        fabricCanvas.on('mouse:down', handleEraser);
        return () => {
            fabricCanvas.off('mouse:down', handleEraser);
        };
    }, [fabricCanvas, activeTool, saveState]);
    const handleUndo = useCallback(() => {
        if (!fabricCanvas || history.currentIndex <= 0)
            return;
        const newIndex = history.currentIndex - 1;
        fabricCanvas.loadFromJSON(JSON.parse(history.states[newIndex])).then(() => {
            fabricCanvas.renderAll();
            setHistory(prev => ({ ...prev, currentIndex: newIndex }));
        });
    }, [fabricCanvas, history]);
    const handleRedo = useCallback(() => {
        if (!fabricCanvas || history.currentIndex >= history.states.length - 1)
            return;
        const newIndex = history.currentIndex + 1;
        fabricCanvas.loadFromJSON(JSON.parse(history.states[newIndex])).then(() => {
            fabricCanvas.renderAll();
            setHistory(prev => ({ ...prev, currentIndex: newIndex }));
        });
    }, [fabricCanvas, history]);
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
                return;
            const shortcuts = {
                'v': 'select',
                'h': 'hand',
                'p': 'draw',
                'l': 'line',
                'a': 'arrow',
                'r': 'rectangle',
                'd': 'diamond',
                'o': 'ellipse',
                't': 'text',
                'e': 'eraser',
            };
            if (shortcuts[e.key.toLowerCase()]) {
                setActiveTool(shortcuts[e.key.toLowerCase()]);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (e.shiftKey) {
                    handleRedo();
                }
                else {
                    handleUndo();
                }
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && fabricCanvas) {
                const activeObjects = fabricCanvas.getActiveObjects();
                if (activeObjects.length) {
                    activeObjects.forEach(obj => fabricCanvas.remove(obj));
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.renderAll();
                    saveState(fabricCanvas);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fabricCanvas, handleUndo, handleRedo, saveState]);
    const handleClear = useCallback(() => {
        if (!fabricCanvas)
            return;
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = 'transparent';
        fabricCanvas.renderAll();
        saveState(fabricCanvas);
        toast.success('Canvas cleared');
    }, [fabricCanvas, saveState]);
    const handleExport = useCallback(() => {
        if (!fabricCanvas)
            return;
        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2,
        });
        const link = document.createElement('a');
        link.download = 'sketchflow-canvas.png';
        link.href = dataURL;
        link.click();
        toast.success('Canvas exported as PNG');
    }, [fabricCanvas]);
    const handleAddImage = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file || !fabricCanvas)
                return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                const imgData = event.target?.result;
                const img = await FabricImage.fromURL(imgData);
                img.scaleToWidth(300);
                fabricCanvas.add(img);
                fabricCanvas.centerObject(img);
                fabricCanvas.renderAll();
                saveState(fabricCanvas);
                toast.success('Image added');
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }, [fabricCanvas, saveState]);


    const zoomToPoint = (newZoom, point) => {
    if (!fabricCanvas) return;

    // clamp zoom
    newZoom = Math.min(Math.max(newZoom, 0.1), 5);

    fabricCanvas.zoomToPoint(point, newZoom);
    fabricCanvas.requestRenderAll();
    setZoom(newZoom);
    };

    const handleZoomIn = useCallback(() => {
    if (!fabricCanvas) return;

    const center = fabricCanvas.getCenter();
    const point = new fabricCanvas.Point(center.left, center.top);

    zoomToPoint(zoom + 0.1, point);
    }, [fabricCanvas, zoom]);

    const handleZoomOut = useCallback(() => {
    if (!fabricCanvas) return;

    const center = fabricCanvas.getCenter();
    const point = new fabricCanvas.Point(center.left, center.top);

    zoomToPoint(zoom - 0.1, point);
    }, [fabricCanvas, zoom]);

    const handleZoomReset = useCallback(() => {
    if (!fabricCanvas) return;

    setZoom(1);
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.requestRenderAll();
    }, [fabricCanvas]);
    // this is zoom wheel handler
    useEffect(() => {
    if (!fabricCanvas) return;

    const handleWheel = (opt) => {
        opt.e.preventDefault();
        opt.e.stopPropagation();

        let zoom = fabricCanvas.getZoom();
        zoom *= opt.e.deltaY > 0 ? 0.95 : 1.05;

        const pointer = fabricCanvas.getPointer(opt.e);

        fabricCanvas.zoomToPoint(
        { x: pointer.x, y: pointer.y },
        Math.min(Math.max(zoom, 0.1), 5)
        );

        fabricCanvas.requestRenderAll();
        setZoom(fabricCanvas.getZoom());
    };

    fabricCanvas.on("mouse:wheel", handleWheel);
    return () => fabricCanvas.off("mouse:wheel", handleWheel);
    }, [fabricCanvas]);


    return {
        canvasRef,
        containerRef,
        activeTool,
        setActiveTool,
        activeColor,
        setActiveColor,
        strokeWidth,
        setStrokeWidth,
        zoom,
        canUndo: history.currentIndex > 0,
        canRedo: history.currentIndex < history.states.length - 1,
        handleUndo,
        handleRedo,
        handleClear,
        handleExport,
        handleAddImage,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
    };
}
