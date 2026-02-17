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

            {/* Main Content Area (Relative Container for Canvas & Floating Panels) */}
            <div className="flex-1 relative flex overflow-hidden">

                {/* 1. Activity Bar (Fixed Left) */}
                {activityBar && (
                    <div className="shrink-0 w-12 bg-transparent z-50 flex flex-col items-center py-4 pointer-events-auto">
                        {activityBar}
                    </div>
                )}

                {/* 2. Sidebar Drawer (Floating Left) */}
                <div
                    className={cn(
                        "absolute left-10 top-0 bottom-0 z-40 bg-white/80 backdrop-blur-xl border-r border-neutral-200 transition-all duration-300 ease-spring shadow-2xl overflow-hidden flex flex-col pointer-events-auto",
                        isSidebarOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full border-none"
                    )}
                >
                    <div className="w-64 h-full flex flex-col">
                        {sidebar}
                    </div>
                </div>

                {/* 3. Canvas (Full Screen Background) */}
                <div className="absolute inset-0 z-0 flex flex-col min-w-0 bg-neutral-950">
                    {/* Top Floating Area */}
                    {header && (
                        <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-4 pl-16">
                            <div className="pointer-events-auto inline-block">
                                {header}
                            </div>
                        </div>
                    )}

                    {/* Actual Canvas Content */}
                    <div className="flex-1 relative overflow-hidden">
                        {children}
                    </div>
                </div>

                {/* 4. Inspector Panel (Floating Right) */}
                <div
                    className={cn(
                        "absolute right-4 top-16 bottom-[100px] z-40 transition-all duration-300 ease-spring pointer-events-none", // Container is pointer-events-none to allow clicking through empty space? No, inspector needs clicks.
                        // Actually, let's make the container fit content or have fixed width but verify positioning
                        isInspectorOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
                    )}
                >
                    <div className="pointer-events-auto shadow-2xl rounded-xl overflow-hidden bg-neutral-900/90 backdrop-blur-md border border-neutral-800">
                        {inspector}
                    </div>
                </div>
            </div>

            {/* Status Bar (Bottom Row, Fixed Height) */}
            <div className="shrink-0 h-6 bg-neutral-900 border-t border-neutral-800 z-50">
                {statusBar}
            </div>
        </div>
    );
}
