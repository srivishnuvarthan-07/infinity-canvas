import { UserProfileMenu } from '../UserProfileMenu';
import { Compass, Search, User as UserIcon, Plus } from 'lucide-react';
import { useLibraryStore } from '@/hooks/useLibraryStore';
import { LibraryItemPreview } from '@/components/layout/LibraryItemPreview';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ExploreView() {
    const { communityItems, addItem } = useLibraryStore();

    const handleSaveToLibrary = async (e, item) => {
        e.stopPropagation();
        try {
            await addItem(item.shapes, item.name);
            toast.success("Saved to your library!");
        } catch (err) {
            toast.error("Failed to save shape");
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden gap-4 p-4 bg-transparent">
            {/* Topbar Filter */}
            <div className="flex items-center justify-between gap-[10px] px-[20px] py-[12px] bg-[#FAFAFA] border border-black/5 rounded-3xl shrink-0 shadow-sm">
                <div className="flex flex-1 max-w-[220px] relative">
                    <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[12px] w-[12px] text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search community..."
                        className="w-full bg-[#FAFAFA] border border-black/5 rounded-full py-[7px] pl-[34px] pr-[14px] text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black/10 transition-colors"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <h1 className="text-[14px] font-medium text-neutral-900 tracking-tight whitespace-nowrap hidden sm:block">
                        Explore
                    </h1>
                </div>

                <div className="ml-auto flex items-center gap-[12px]">
                    <UserProfileMenu />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-[24px] overflow-auto flex-1 bg-[#FAFAFA] border border-black/5 rounded-3xl shadow-sm relative">
                <div className="max-w-[1000px] mx-auto pb-[24px]">
                    
                    {/* Featured Boards */}
                    <div className="mb-[32px]">
                        <h2 className="text-[13px] font-medium text-neutral-900 mb-[16px]">Featured boards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
                            {/* Mock Featured Board 1 */}
                            <div className="bg-white border-[0.5px] border-black/5 rounded-[12px] overflow-hidden cursor-pointer hover:-translate-y-[3px] hover:border-black/10 transition-all duration-[180ms] ease-out flex flex-col h-[180px]">
                                <div className="h-[120px] w-full bg-[#E1F5EE] flex items-center justify-center relative">
                                    <Compass className="w-[20px] h-[20px] text-[#0F6E56] opacity-50" />
                                </div>
                                <div className="p-[12px_14px] flex flex-col border-t-[0.5px] border-black/5 bg-white shrink-0">
                                    <h3 className="font-medium text-[13px] text-neutral-900 tracking-tight truncate">Product Roadmap 2026</h3>
                                    <span className="text-[11px] text-neutral-500 mt-[3px]">By Infinity Team</span>
                                </div>
                            </div>
                            
                            {/* Mock Featured Board 2 */}
                            <div className="bg-white border-[0.5px] border-black/5 rounded-[12px] overflow-hidden cursor-pointer hover:-translate-y-[3px] hover:border-black/10 transition-all duration-[180ms] ease-out flex flex-col h-[180px]">
                                <div className="h-[120px] w-full bg-[#EEEDFE] flex items-center justify-center relative">
                                    <Compass className="w-[20px] h-[20px] text-[#534AB7] opacity-50" />
                                </div>
                                <div className="p-[12px_14px] flex flex-col border-t-[0.5px] border-black/5 bg-white shrink-0">
                                    <h3 className="font-medium text-[13px] text-neutral-900 tracking-tight truncate">System Architecture</h3>
                                    <span className="text-[11px] text-neutral-500 mt-[3px]">By Infinity Team</span>
                                </div>
                            </div>

                            {/* Mock Featured Board 3 */}
                            <div className="bg-white border-[0.5px] border-black/5 rounded-[12px] overflow-hidden cursor-pointer hover:-translate-y-[3px] hover:border-black/10 transition-all duration-[180ms] ease-out flex flex-col h-[180px]">
                                <div className="h-[120px] w-full bg-[#E6F1FB] flex items-center justify-center relative">
                                    <Compass className="w-[20px] h-[20px] text-[#185FA5] opacity-50" />
                                </div>
                                <div className="p-[12px_14px] flex flex-col border-t-[0.5px] border-black/5 bg-white shrink-0">
                                    <h3 className="font-medium text-[13px] text-neutral-900 tracking-tight truncate">User Persona Workshop</h3>
                                    <span className="text-[11px] text-neutral-500 mt-[3px]">By Infinity Team</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trending Boards */}
                    <div className="mb-[32px]">
                        <h2 className="text-[13px] font-medium text-neutral-900 mb-[16px]">Trending boards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px]">
                            {[1, 2, 3, 4].map(idx => (
                                <div key={idx} className="bg-white border-[0.5px] border-black/5 rounded-[12px] overflow-hidden cursor-pointer hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out flex flex-col h-[140px]">
                                    <div className="flex-1 w-full bg-[#FAFAFA] flex items-center justify-center relative">
                                        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                                            <defs>
                                                <pattern id="dotGrid" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#000" /></pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill="url(#dotGrid)" />
                                        </svg>
                                    </div>
                                    <div className="p-[10px_12px] flex flex-col border-t-[0.5px] border-black/5 bg-white shrink-0">
                                        <h3 className="font-medium text-[12px] text-neutral-900 tracking-tight truncate">Community Map {idx}</h3>
                                        <span className="text-[10px] text-neutral-500 mt-[2px]">By User {idx}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Community Shapes Section */}
                    <div>
                        <div className="flex items-center justify-between mb-[16px]">
                            <h2 className="text-[13px] font-medium text-neutral-900">Community shapes</h2>
                            <span className="bg-white border border-black/5 text-neutral-500 px-[8px] py-[3px] rounded-full text-[10px] font-medium">{communityItems.length} styles</span>
                        </div>
                        
                        {communityItems.length === 0 ? (
                            <div className="bg-white border-[0.5px] border-dashed border-black/10 rounded-[12px] p-8 text-center flex items-center justify-center">
                                <span className="text-[12px] text-neutral-500">No community shapes published yet. Publish yours from the Library!</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[16px]">
                                {communityItems.map(item => (
                                    <div key={item.id} className="group relative bg-white border-[0.5px] border-black/5 rounded-[12px] flex flex-col items-center cursor-pointer hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out p-[10px] h-auto">
                                        {/* Preview Area */}
                                        <div className="w-full aspect-square bg-[#FAFAFA] rounded-[8px] mb-[10px] relative overflow-hidden flex items-center justify-center border border-black/5">
                                            <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                                                <defs>
                                                    <pattern id="dotGrid" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#000" /></pattern>
                                                </defs>
                                                <rect width="100%" height="100%" fill="url(#dotGrid)" />
                                            </svg>
                                            
                                            {/* Use absolute positioning to guarantee sizing inside aspect-square parent */}
                                            <div className="absolute inset-[10%]">
                                                <LibraryItemPreview shapes={item.shapes} />
                                            </div>

                                            {/* Hover Action Overlay */}
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                                <Button 
                                                    onClick={(e) => handleSaveToLibrary(e, item)}
                                                    size="sm" 
                                                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-medium h-[28px] px-3 rounded-full shadow-sm flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-[12px] h-[12px]" strokeWidth={2.5}/>
                                                    Save
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="w-full flex-1 flex flex-col">
                                            <span className="text-[12px] text-neutral-900 font-medium truncate w-full mb-[2px]">
                                                {item.name}
                                            </span>
                                            <div className="flex items-center gap-[4px] text-[10px] text-neutral-500">
                                                <UserIcon className="w-[10px] h-[10px]" strokeWidth={2}/>
                                                <span className="truncate flex-1">{item.userName || "Community"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
