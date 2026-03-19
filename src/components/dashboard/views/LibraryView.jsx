import { UserProfileMenu } from '../UserProfileMenu';
import { NotificationBell } from '../NotificationBell';
import { Shapes } from 'lucide-react';

import { LibraryPanel } from '@/components/layout/LibraryPanel';
import { useLibraryStore } from '@/hooks/useLibraryStore';

export default function LibraryView() {
    const { items, removeItem, addItem, promoteToCore, demoteFromCore, coreItems, normalItems } = useLibraryStore();

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
            <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10 bg-neutral-50/50">
                <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    <LibraryPanel
                        items={items}
                        onDeleteItem={removeItem}
                        onAddItem={addItem}
                        promoteToCore={promoteToCore}
                        demoteFromCore={demoteFromCore}
                        coreItems={coreItems}
                        normalItems={normalItems}
                    />
                </div>
            </main>
        </div>
    );
}
