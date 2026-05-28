import React from 'react';
import { useLibraryStore } from '@/hooks/useLibraryStore';
import { LibraryPanel } from '@/components/layout/LibraryPanel';

export default function LibraryView() {
    const { 
        items, 
        removeItem, 
        addItem, 
        libraryItems, 
        communityItems 
    } = useLibraryStore();

    return (
        <div className="relative flex-1 h-full w-full overflow-hidden bg-[#FAF9F5]">
            <LibraryPanel
                isDashboardMode={true}
                items={items}
                onDeleteItem={removeItem}
                onAddItem={addItem}
                libraryItems={libraryItems}
                communityItems={communityItems}
            />
        </div>
    );
}
