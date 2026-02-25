import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { BoardExplorer } from "@/components/layout/BoardExplorer";
import { LibraryPanel } from "@/components/layout/LibraryPanel";
import { ActivityBar } from "@/components/layout/ActivityBar";
import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import { useBoardStore } from "@/hooks/useBoardStore";
import { useLibraryStore } from "@/hooks/useLibraryStore";
import { useSocket } from "@/hooks/useSocket";
import { StatusBar } from "@/components/layout/StatusBar";
import ErrorBoundary from "@/components/ui/error-boundary";


const Workspace = () => {
    const { boardId } = useParams();
    const navigate = useNavigate();

    // Stores
    const {
        localBoards,
        cloudBoards,
        activeBoardId,
        isLoaded: isBoardsLoaded,
        createBoard,
        deleteBoard,
        renameBoard,
        setActiveBoardId,
        updateBoardShapes,
        updateBoardAccess,
        addBoardMember,
        removeBoardMember,
        fetchBoard,
        fetchBoardData,
        getBoardById,
        boardDataCache,
        toggleCollaboration,
    } = useBoardStore();

    // Active board — pulled from both lists + data cache
    const activeBoard = getBoardById(activeBoardId);

    // All boards combined for the board explorer sidebar
    const allBoards = [...localBoards, ...cloudBoards];

    const {
        items: libraryItems,
        isLoaded: isLibraryLoaded,
        addItem: addLibraryItem,
        removeItem: removeLibraryItem
    } = useLibraryStore();

    // Socket Connection
    const socket = useSocket();

    useEffect(() => {
        if (!activeBoard || activeBoard.isLocal) return;

        if (activeBoard.isLive) {
            socket.connect(activeBoardId);
        } else {
            socket.disconnect();
        }
    }, [activeBoard?.isLive, activeBoard?.isLocal, activeBoardId, socket]);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [activeView, setActiveView] = useState('boards'); // 'boards' | 'library'

    // Canvas State
    const [selectedElement, setSelectedElement] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const isLoaded = isBoardsLoaded && isLibraryLoaded;

    // Sync URL param → Store
    useEffect(() => {
        if (!boardId) return;

        let isMounted = true;

        const load = async () => {
            // Check if meta is already in any list
            const state = useBoardStore.getState();
            const existingMeta =
                state.localBoards.find(b => b.id === boardId) ||
                state.cloudBoards.find(b => b.id === boardId);

            if (existingMeta) {
                setActiveBoardId(boardId);
                // Fetch data only if not cached yet
                if (!state.boardDataCache[boardId]) {
                    fetchBoardData(boardId);
                }
                return;
            }

            await fetchBoard(boardId);

            if (!isMounted) return;

            const updated = useBoardStore.getState();
            const found =
                updated.localBoards.find(b => b.id === boardId) ||
                updated.cloudBoards.find(b => b.id === boardId);

            if (found) {
                setActiveBoardId(boardId);
            } else {
                toast.error("Board not found");
            }
        };

        load();

        return () => { isMounted = false; };
    }, [boardId, fetchBoard, fetchBoardData, setActiveBoardId]);

    // Auto-open inspector when selecting
    useEffect(() => {
        setIsInspectorOpen(!!selectedElement);
    }, [selectedElement]);

    const handleCanvasInteraction = () => {
        if (isSidebarOpen) setIsSidebarOpen(false);
    };

    if (!isLoaded) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-neutral-950 text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading Workspace...</span>
            </div>
        );
    }

    if (!activeBoard || !boardDataCache[activeBoardId]) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-neutral-950 text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading Board...</span>
            </div>
        );
    }

    // Resolve Sidebar Content
    let sidebarContent = null;
    if (activeView === 'boards') {
        sidebarContent = (
            <BoardExplorer
                boards={allBoards}
                activeBoardId={activeBoardId}
                onSelectBoard={(id) => navigate(`/board/${id}`)}
                onCreateBoard={async () => {
                    const newId = await createBoard();
                    navigate(`/board/${newId}`);
                }}
                onDeleteBoard={deleteBoard}
            />
        );
    } else if (activeView === 'library') {
        sidebarContent = (
            <LibraryPanel
                items={libraryItems}
                onDeleteItem={removeLibraryItem}
                onAddItem={addLibraryItem}
            />
        );
    }

    return (
        <>
            <Helmet>
                <title>{activeBoard.name} - Infinity Canvas</title>
            </Helmet>

            <AppLayout
                isSidebarOpen={isSidebarOpen}
                isInspectorOpen={isInspectorOpen}

                activityBar={
                    <ActivityBar
                        activeView={activeView}
                        onViewChange={(view) => {
                            if (activeView === view && isSidebarOpen) {
                                setIsSidebarOpen(false);
                            } else {
                                setActiveView(view);
                                setIsSidebarOpen(true);
                            }
                        }}
                    />
                }
                sidebar={sidebarContent}
                header={null}
                inspector={null}
                statusBar={
                    <StatusBar
                        isSaved={true}
                        isSyncing={false}
                        zoom={zoom}
                        mousePos={mousePos}
                    />
                }
            >
                <ErrorBoundary>
                    <DrawingCanvas
                        key={activeBoardId}
                        initialShapes={activeBoard.shapes}
                        onSave={(shapes, thumbnail) => updateBoardShapes(activeBoardId, shapes, thumbnail)}
                        socket={socket}

                        boardId={activeBoardId}
                        boardName={activeBoard.name}
                        ownerId={activeBoard.owner}
                        isLocal={activeBoard.isLocal}
                        isLive={activeBoard.isLive}
                        linkAccess={activeBoard.linkAccess}
                        visibility={activeBoard.visibility}
                        members={activeBoard.members}
                        onToggleLive={(live) => toggleCollaboration(activeBoardId, live)}
                        onUpdateAccess={(access) => updateBoardAccess(activeBoardId, access)}
                        onInviteMember={(email, role) => addBoardMember(activeBoardId, email, role)}
                        onRemoveMember={(userId) => removeBoardMember(activeBoardId, userId)}
                        onRename={(name) => renameBoard(activeBoardId, name)}
                        onBack={() => navigate('/dashboard')}

                        onSelectionChange={setSelectedElement}
                        onZoomChange={setZoom}
                        onMouseMove={setMousePos}
                        onInteraction={handleCanvasInteraction}
                        disablePropertyPanel={false}

                        libraryItems={libraryItems}
                        onAddToLibrary={(shapes, name) => {
                            try {
                                addLibraryItem(shapes, name);
                                setActiveView('library');
                                setIsSidebarOpen(true);
                                toast.success("Added to Library");
                            } catch (err) {
                                console.error("Failed to add to library:", err);
                                toast.error("Failed to add to library");
                            }
                        }}
                    />
                </ErrorBoundary>
            </AppLayout>
        </>
    );
};

export default Workspace;
