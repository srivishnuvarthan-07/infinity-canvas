
import { cn } from "@/lib/utils";

export function AppLayout({ activityBar, sidebar, header, children, isSidebarOpen }) {
    return (
        <div className="flex h-screen w-full bg-neutral-950 overflow-hidden">

            {/* Activity Bar (Far Left) */}
            {activityBar && (
                <div className="shrink-0 w-12 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-4 z-50">
                    {activityBar}
                </div>
            )}

            {/* Sidebar (Explorer / Library) */}
            <div
                className={cn(
                    "shrink-0 z-50 shadow-xl transition-all duration-300 ease-in-out border-r border-neutral-800 bg-neutral-900 overflow-hidden",
                    // If open, width is auto (or fixed by child). If closed, width is 0.
                    // Since BoardExplorer has fixed width (w-64), we can animate max-width or width.
                    // Using margins or transform might be smoother but triggers layout thrashing less with width.
                    isSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-none"
                )}
            >
                <div className="w-64 h-full">
                    {sidebar}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="shrink-0 z-40">
                    {header}
                </div>

                {/* Canvas Content */}
                <div className="flex-1 relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
