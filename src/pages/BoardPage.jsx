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
import { useAuth } from "@/hooks/useAuth";
import { StatusBar } from "@/components/layout/StatusBar";
import ErrorBoundary from "@/components/ui/error-boundary";
import { SignupModal } from "@/components/auth/SignupModal";


const BoardPage = () => {
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
        isLoaded: isLibraryLoaded,
        addItem: addLibraryItem,
        removeItem: removeLibraryItem,
        libraryItems,
        communityItems,
        publishToCommunity
    } = useLibraryStore();

    // Socket & Auth
    const socket = useSocket();
    const { user } = useAuth();

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
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

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
                <span className="ml-2">Loading Board...</span>
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

    // Access Control: Private Board Protection
    const isOwner = activeBoard.isLocal || (user && user._id === activeBoard.owner);
    
    if (!activeBoard.isLive && !isOwner) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-neutral-50 text-neutral-900 font-sans">
                <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h1 className="text-2xl font-semibold mb-2">This board is private</h1>
                <p className="text-neutral-500 mb-8 max-w-sm text-center">The owner hasn't started a live session yet. You can only view this board if the owner turns on the live session.</p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                >
                    Back to Dashboard
                </button>
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
                onDeleteItem={removeLibraryItem}
                onAddItem={addLibraryItem}
                libraryItems={libraryItems}
                communityItems={communityItems}
                onPublishItem={publishToCommunity}
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
                            if (!user) {
                                setIsSignupModalOpen(true);
                                return;
                            }
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
            <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} />
        </>
    );
};

export default BoardPage;
