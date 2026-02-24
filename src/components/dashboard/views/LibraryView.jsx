import { UserProfileMenu } from '../UserProfileMenu';
import { NotificationBell } from '../NotificationBell';
import { Shapes } from 'lucide-react';

export default function LibraryView() {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Contextual Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 sticky top-0 bg-[#F6F5F3]/80 backdrop-blur-md border-b border-black/5">
                <div className="flex items-center gap-3">
                    <Shapes className="h-5 w-5 text-neutral-400" />
                    <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
                        Library
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <UserProfileMenu />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed border-black/10 bg-white/30 text-sm">
                        <Shapes className="h-10 w-10 text-neutral-300 mb-4" />
                        <h2 className="text-lg font-medium text-neutral-800 mb-2">Component Library</h2>
                        <p className="text-neutral-500 max-w-md mx-auto">
                            Coming soon. This space will house reusable components, templates, saved diagram snippets, and AI-generated modules.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
