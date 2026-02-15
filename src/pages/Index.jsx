import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { BoardExplorer } from "@/components/layout/BoardExplorer";
import { LibraryPanel } from "@/components/layout/LibraryPanel";
import { ActivityBar } from "@/components/layout/ActivityBar";
import { TopBar } from "@/components/layout/TopBar";
import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import { useBoardStore } from "@/hooks/useBoardStore";
import { useLibraryStore } from "@/hooks/useLibraryStore";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Index = () => {
  // Stores
  const {
    boards,
    activeBoardId,
    activeBoard,
    isLoaded: isBoardsLoaded,
    createBoard,
    deleteBoard,
    renameBoard,
    setActiveBoardId,
    updateBoardShapes
  } = useBoardStore();

  const {
    items: libraryItems,
    isLoaded: isLibraryLoaded,
    addItem: addLibraryItem,
    removeItem: removeLibraryItem
  } = useLibraryStore();

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('boards'); // 'boards' | 'library'

  const isLoaded = isBoardsLoaded && isLibraryLoaded;

  // Prevent hydration mismatch or empty render
  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-950 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-950 text-neutral-500">
        No active board selected.
      </div>
    );
  }

  // Resolve Sidebar Content
  let sidebarContent = null;
  if (activeView === 'boards') {
    sidebarContent = (
      <BoardExplorer
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={setActiveBoardId}
        onCreateBoard={createBoard}
        onDeleteBoard={deleteBoard}
      />
    );
  } else if (activeView === 'library') {
    sidebarContent = (
      <LibraryPanel
        items={libraryItems}
        onDeleteItem={removeLibraryItem}
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
        activityBar={
          <ActivityBar
            activeView={activeView}
            onViewChange={(view) => {
              setActiveView(view);
              if (!isSidebarOpen) setIsSidebarOpen(true);
            }}
          />
        }
        sidebar={sidebarContent}
        header={
          <TopBar
            boardName={activeBoard.name}
            isSaved={true}
            onRename={(name) => renameBoard(activeBoardId, name)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        }
      >
        <DrawingCanvas
          key={activeBoardId}
          initialShapes={activeBoard.shapes}
          onSave={(shapes) => updateBoardShapes(activeBoardId, shapes)}

          // Library Injection
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
      </AppLayout>
    </>
  );
};

export default Index;

