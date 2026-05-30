import { cn } from "@/lib/utils";

export function AppLayout({
    activityBar,
    sidebar,
    header,
    children,
    inspector,
    statusBar,
    isSidebarOpen,
    isInspectorOpen
}) {
    return (
        <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-200 overflow-hidden">

            {/* Main Content Area — Canvas takes ALL space, everything floats on top */}
            <div className="flex-1 relative overflow-hidden">

                {/* 1. Canvas (Full Screen Background) — inset-0, no layout shrinking */}
                <div className="absolute inset-0 z-0 bg-neutral-950">
                    {/* Actual Canvas Content */}
                    {children}
                </div>

                {/* 2. Activity Bar — floating overlay, no layout impact */}
                {activityBar && (
                    <div className="absolute left-0 top-0 bottom-0 w-12 z-50 flex flex-col items-center py-4 pointer-events-auto">
                        {activityBar}
                    </div>
                )}

                {/* 3. Sidebar Drawer (Floating Left, offset by activity bar width) */}
                <div
                    className={cn(
                        "absolute left-12 top-0 bottom-0 z-40 bg-white/90 backdrop-blur-xl border-r border-neutral-200/60 transition-all duration-300 shadow-2xl overflow-hidden flex flex-col pointer-events-auto",
                        isSidebarOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full border-none"
                    )}
                >
                    <div className="w-64 h-full flex flex-col">
                        {sidebar}
                    </div>
                </div>

                {/* 4. Inspector Panel (Floating Right) */}
                <div
                    className={cn(
                        "absolute right-4 top-16 bottom-[100px] z-40 transition-all duration-300 pointer-events-none",
                        isInspectorOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
                    )}
                >
                    <div className="pointer-events-auto shadow-2xl rounded-xl overflow-hidden bg-neutral-900/90 backdrop-blur-md border border-neutral-800">
                        {inspector}
                    </div>
                </div>
            </div>

            {/* Status Bar — auto-hide: collapsed by default, expands on hover */}
            <div className="group shrink-0 z-50 relative">
                <div className="h-[2px] bg-neutral-800 group-hover:h-6 transition-all duration-200 overflow-hidden">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 bg-neutral-900 border-t border-neutral-800">
                        {statusBar}
                    </div>
                </div>
            </div>
        </div>
    );
}
