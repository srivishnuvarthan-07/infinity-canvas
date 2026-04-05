import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Users, Link2, Pencil, Eye, Check, Lock, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// =========================================================================
// STABLE SUB-COMPONENTS (Defined outside to prevent re-mounting)
// =========================================================================

const AvatarStack = ({ users, max = 3 }) => {
    // Fallback fake data if activeUsers is empty for preview
    const displayUsers = users && users.length > 0 ? users : [
        { displayName: 'V', color: '#7F77DD' },
        { displayName: 'A', color: '#1D9E75' },
        { displayName: 'S', color: '#D85A30' },
        { displayName: 'R', color: '#378ADD' }
    ];

    return (
        <div className="flex items-center -space-x-[6px]">
            {displayUsers.slice(0, max).map((user, i) => (
                <div 
                    key={i} 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium text-white border-[1.5px] border-white ring-1 ring-black/5"
                    style={{ backgroundColor: user.color || '#888780' }}
                    title={user.displayName}
                >
                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                </div>
            ))}
        </div>
    );
};

const BoardLinkBox = ({ boardUrl, onCopy, isCopied, showSublabel = false }) => (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
        <h3 className="text-[11px] font-medium text-neutral-400/80 uppercase tracking-widest">Board Link</h3>
        <div className="flex items-center gap-2 p-[9px] pl-3 bg-[#F5F4F0] border border-black/10 rounded-[8px]">
            <Link2 className="w-[13px] h-[13px] text-neutral-400 shrink-0" />
            <span className="flex-1 text-[11px] font-mono text-neutral-500 truncate mr-2">
                {boardUrl.replace('http://', '').replace('https://', '')}
            </span>
            <button 
                onClick={onCopy}
                className={cn(
                    "px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-all duration-200 shrink-0 border",
                    isCopied 
                        ? "bg-[#EAF3DE] text-[#3B6D11] border-[#C0DD97]" 
                        : "bg-white text-neutral-700 border-black/10 hover:border-black/20"
                )}
            >
                {isCopied ? (
                    <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copied!
                    </div>
                ) : "Copy link"}
            </button>
        </div>
        {showSublabel && (
            <p className="text-[11px] text-neutral-400 mt-1.5">Share this link to invite others</p>
        )}
    </div>
);

const PresentBox = ({ users, text }) => (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
        <h3 className="text-[11px] font-medium text-neutral-400/80 uppercase tracking-widest">Currently on this board</h3>
        <div className="flex items-center justify-between p-[10px] px-[14px] bg-[#F5F4F0] border border-black/10 rounded-[8px]">
            <div className="flex items-center gap-3">
                <AvatarStack users={users} max={users.length > 3 ? 4 : 3} />
                <span className="text-[11px] text-neutral-500">{text}</span>
            </div>
            <div className="w-[6px] h-[6px] rounded-full bg-[#639922] animate-pulse" style={{ animationDuration: '1.4s' }} />
        </div>
    </div>
);

export function ShareDialog({
    isOpen,
    onClose,
    boardName,
    isLive,
    onToggleLive,
    linkAccess, // 'none' | 'view' | 'edit'
    onUpdateAccess,
    activeUsers = [],
    isOwner = false,
    isLoggedIn = false
}) {
    const [copied, setCopied] = useState(false);
    const [localMode, setLocalMode] = useState(linkAccess === 'none' ? 'edit' : linkAccess);
    
    // Variant Logic
    const variant = isOwner ? 'owner' : (isLoggedIn ? 'collaborator' : 'guest');

    // Derived states
    const headerSubtitleA = isLive 
        ? "Share the link to invite collaborators" 
        : "Start a session to invite collaborators";
    
    const boardUrl = `${window.location.origin}/board/${window.location.pathname.split('/').pop()}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(boardUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleSession = (checked) => {
        onToggleLive?.(checked);
        if (checked && linkAccess === 'none') {
            onUpdateAccess?.({ linkAccess: 'edit' });
            setLocalMode('edit');
        }
    };

    const handleSelectMode = (mode) => {
        if (!isLive) return;
        setLocalMode(mode);
        onUpdateAccess?.({ linkAccess: mode });
    };

    // =========================================================================
    // VARIANT RENDERERS
    // =========================================================================




    // =========================================================================
    // VARIANT A: OWNER
    // =========================================================================
    const renderVariantA = () => (
        <div className="flex flex-col h-full animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 relative bg-white border-b border-black/5">
                <h2 className="text-[15px] font-medium text-black leading-tight">Share "{boardName}"</h2>
                <p className="text-[12px] text-neutral-500 mt-0.5">{headerSubtitleA}</p>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 space-y-[18px] bg-white">
                {/* Session Row */}
                <div className={cn(
                    "flex items-center justify-between p-[14px] px-[16px] rounded-[12px] border transition-all duration-200",
                    isLive ? "border-[#7F77DD] bg-[#FAFAFE]" : "border-black/10 bg-[#F5F4F0]"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-[36px] h-[36px] rounded-[9px] flex items-center justify-center transition-colors duration-200",
                            isLive ? "bg-[#EEEDFE]" : "bg-[#F1EFE8]"
                        )}>
                            <Users className={cn(
                                "w-4 h-4 transition-colors duration-200",
                                isLive ? "text-[#7F77DD]" : "text-[#888780]"
                            )} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-black">Live session</span>
                            <span className={cn(
                                "text-[11px] transition-colors duration-200 mt-0.5",
                                isLive ? "text-[#7F77DD]" : "text-[#888780]"
                            )}>
                                {isLive ? "On — session is live" : "Off — board is private"}
                            </span>
                        </div>
                    </div>
                    {/* Toggle */}
                    <button 
                        onClick={() => handleToggleSession(!isLive)}
                        className={cn(
                            "relative w-[36px] h-[20px] rounded-full transition-colors duration-200 outline-none",
                            isLive ? "bg-[#7F77DD]" : "bg-[#D3D1C7]"
                        )}
                    >
                        <div className={cn(
                            "absolute top-[2px] left-[2px] w-[16px] h-[16px] bg-white rounded-full transition-transform duration-200 shadow-sm",
                            isLive && "translate-x-[16px]"
                        )} />
                    </button>
                </div>

                {!isLive ? (
                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center py-[28px] px-6 rounded-[12px] border border-dashed border-black/10 bg-[#F5F4F0] animate-in fade-in zoom-in-95 duration-200">
                        <Users className="w-[28px] h-[28px] text-neutral-400/60 mb-2" />
                        <span className="text-[12px] font-medium text-neutral-500">No active session</span>
                        <p className="text-[11px] text-neutral-400 text-center mt-1.5 leading-[1.5]">
                            Toggle Live session on to generate<br/>a shareable link
                        </p>
                    </div>
                ) : (
                    <>
                        <BoardLinkBox boardUrl={boardUrl} onCopy={handleCopyLink} isCopied={copied} />

                        {/* Collaboration Mode */}
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
                            <h3 className="text-[11px] font-medium text-neutral-400/80 uppercase tracking-widest">Collaboration Mode</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {/* Edit */}
                                <button onClick={() => handleSelectMode('edit')} className={cn(
                                    "flex items-center justify-between p-[11px] px-[14px] rounded-[8px] border transition-all duration-200",
                                    localMode === 'edit' ? "border-[#7F77DD] bg-[#FAFAFE]" : "border-black/10 bg-white hover:border-black/20"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors duration-200", localMode === 'edit' ? "bg-[#EEEDFE]" : "bg-neutral-50")}>
                                            <Pencil className={cn("w-3.5 h-3.5 transition-colors duration-200", localMode === 'edit' ? 'text-[#534AB7]' : 'text-neutral-400')} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[13px] font-medium text-black">Edit</span>
                                            <span className="text-[11px] text-neutral-500 mt-0.5">Anyone with the link can draw and edit</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-[14px] h-[14px] rounded-full border flex items-center justify-center transition-all duration-200",
                                        localMode === 'edit' ? "border-[#7F77DD] bg-[#7F77DD]" : "border-black/20 bg-transparent"
                                    )}>
                                        {localMode === 'edit' && <div className="w-[5px] h-[5px] bg-white rounded-full" />}
                                    </div>
                                </button>
                                {/* View only */}
                                <button onClick={() => handleSelectMode('view')} className={cn(
                                    "flex items-center justify-between p-[11px] px-[14px] rounded-[8px] border transition-all duration-200",
                                    localMode === 'view' ? "border-[#7F77DD] bg-[#FAFAFE]" : "border-black/10 bg-white hover:border-black/20"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors duration-200", localMode === 'view' ? "bg-[#E6F1FB]" : "bg-neutral-50")}>
                                            <Eye className={cn("w-3.5 h-3.5 transition-colors duration-200", localMode === 'view' ? 'text-[#185FA5]' : 'text-neutral-400')} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[13px] font-medium text-black">View only</span>
                                            <span className="text-[11px] text-neutral-500 mt-0.5">Anyone with the link can only view</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-[14px] h-[14px] rounded-full border flex items-center justify-center transition-all duration-200",
                                        localMode === 'view' ? "border-[#7F77DD] bg-[#7F77DD]" : "border-black/20 bg-transparent"
                                    )}>
                                        {localMode === 'view' && <div className="w-[5px] h-[5px] bg-white rounded-full" />}
                                    </div>
                                </button>
                            </div>
                        </div>

                        <PresentBox users={activeUsers} text={activeUsers.length === 1 ? 'Just you are here now' : `You + ${activeUsers.length > 0 ? activeUsers.length-1 : 2} others are here now`} />
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-black/10 flex justify-end bg-white">
                <button onClick={onClose} className="px-[24px] py-[8px] bg-black text-white text-[13px] font-medium rounded-[8px] hover:opacity-85 transition-opacity">
                    Done
                </button>
            </div>
        </div>
    );

    // =========================================================================
    // VARIANT B: COLLABORATOR (Logged in, not owner)
    // =========================================================================
    const renderVariantB = () => (
        <div className="flex flex-col h-full animate-in fade-in duration-200 bg-white">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 relative border-b border-black/5">
                <h2 className="text-[15px] font-medium text-black leading-tight">Share "{boardName}"</h2>
                <p className="text-[12px] text-neutral-500 mt-0.5">You're collaborating on this board</p>
            </div>

            <div className="px-5 pb-5 space-y-[18px]">
                {/* Visual Fake Toggle Row (Always ON, locked) */}
                <div className="flex items-center justify-between p-[14px] px-[16px] rounded-[12px] border border-[#7F77DD] bg-[#FAFAFE] transition-all duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-[36px] h-[36px] rounded-[9px] bg-[#EEEDFE] flex items-center justify-center">
                            <Users className="w-4 h-4 text-[#7F77DD]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-black">Live session</span>
                            <span className="text-[11px] text-[#7F77DD] mt-0.5">On — session is live</span>
                        </div>
                    </div>
                    {/* Disabled Toggle */}
                    <div className="relative w-[36px] h-[20px] rounded-full bg-[#7F77DD] opacity-50 cursor-not-allowed pointer-events-none">
                        <div className="absolute top-[2px] left-[2px] w-[16px] h-[16px] bg-white rounded-full translate-x-[16px] shadow-sm" />
                    </div>
                </div>

                <BoardLinkBox boardUrl={boardUrl} onCopy={handleCopyLink} isCopied={copied} />

                {/* Read Only Collaboration Mode */}
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
                    <h3 className="text-[11px] font-medium text-neutral-400/80 uppercase tracking-widest">Collaboration Mode</h3>
                    <div className="flex items-center justify-between p-[11px] px-[14px] rounded-[8px] border border-black/5 bg-white opacity-85 cursor-not-allowed pointer-events-none">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-[6px] flex items-center justify-center", localMode==='edit' ? 'bg-[#EEEDFE]' : 'bg-[#E6F1FB]')}>
                                {localMode === 'edit' ? <Pencil className="w-3.5 h-3.5 text-[#534AB7]" /> : <Eye className="w-3.5 h-3.5 text-[#185FA5]" />}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[13px] font-medium text-black">{localMode === 'edit' ? 'Edit' : 'View only'}</span>
                                <span className="text-[11px] text-neutral-500 mt-0.5">{localMode === 'edit' ? 'You can draw and edit this board' : 'You can view but not edit this board'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-[#F1EFE8] border border-black/5 rounded-full px-2 py-[2px] text-[#5F5E5A]">
                            <Lock className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-medium">Owner only</span>
                        </div>
                    </div>
                </div>

                {/* Present Box with extra details */}
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-250">
                    <h3 className="text-[11px] font-medium text-neutral-400/80 uppercase tracking-widest">Currently on this board</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-[10px] px-[14px] bg-[#F5F4F0] border border-black/10 rounded-[8px]">
                            <div className="flex items-center gap-3">
                                <AvatarStack users={activeUsers} max={4} />
                                <span className="text-[11px] text-neutral-500">{activeUsers.length || 4} people are here now</span>
                            </div>
                            <div className="w-[6px] h-[6px] rounded-full bg-[#639922] animate-pulse" style={{ animationDuration: '1.4s' }} />
                        </div>
                        <div className="text-[11px] text-neutral-400 text-center px-[14px] pt-[2px]">
                            {/* Mock list of names based on active users, usually passed down */}
                            {activeUsers.length > 0 ? activeUsers.map(u => u.displayName).join('  ·  ') : "viv (owner)  ·  arjun  ·  sara  ·  you"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-black/10 flex justify-end">
                <button onClick={onClose} className="px-[24px] py-[8px] bg-transparent border border-black/15 text-black text-[13px] font-medium rounded-[8px] hover:bg-[#F5F4F0] transition-colors">
                    Close
                </button>
            </div>
        </div>
    );

    // =========================================================================
    // VARIANT C: GUEST (Not logged in)
    // =========================================================================
    const renderVariantC = () => (
        <div className="flex flex-col h-full animate-in fade-in duration-200 bg-white">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 relative border-b border-black/5">
                <h2 className="text-[15px] font-medium text-black leading-tight">Share "{boardName}"</h2>
                <p className="text-[12px] text-neutral-500 mt-0.5">You're viewing as a guest</p>
            </div>

            <div className="px-5 pb-5 space-y-[18px]">
                {/* Guest Status Row */}
                <div className="flex items-center justify-between p-[14px] px-[16px] rounded-[12px] border border-black/10 bg-white">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-[36px] h-[36px] rounded-[9px] flex items-center justify-center", localMode==='edit'?'bg-[#EEEDFE]':'bg-[#E6F1FB]')}>
                            {localMode === 'edit' ? <Pencil className="w-4 h-4 text-[#7F77DD]" /> : <Eye className="w-4 h-4 text-[#185FA5]" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-black">{localMode === 'edit' ? 'You can edit this board' : "You're viewing this board"}</span>
                            <span className={cn("text-[11px] mt-0.5", localMode==='edit'?'text-[#7F77DD]':'text-[#185FA5]')}>
                                {localMode === 'edit' ? 'Guest editor — changes are live' : 'Read only — you cannot draw'}
                            </span>
                        </div>
                    </div>
                    <div className={cn("rounded-full px-[10px] py-[3px] text-[10px] font-medium", localMode==='edit'?'bg-[#EEEDFE] text-[#534AB7]':'bg-[#E6F1FB] text-[#185FA5]')}>
                        {localMode === 'edit' ? 'Edit' : 'View only'}
                    </div>
                </div>

                <BoardLinkBox boardUrl={boardUrl} onCopy={handleCopyLink} isCopied={copied} showSublabel={true} />

                <PresentBox users={activeUsers} text={`${activeUsers.length || 3} people are here now`} />

                {/* Upsell Card */}
                <div className="flex items-center justify-between p-[14px] px-[16px] rounded-[12px] border border-[#CECBF6] bg-[#FAFAFE] border-l-[3px] border-l-[#7F77DD]">
                    <div className="flex items-center gap-3">
                        <div className="w-[32px] h-[32px] rounded-[8px] bg-[#EEEDFE] flex items-center justify-center">
                            <InfinityIcon className="w-[18px] h-[18px] text-[#7F77DD]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-[#3C3489]">Save your own boards</span>
                            <span className="text-[11px] text-[#534AB7] mt-0.5 leading-[1.5]">Sign up free to create, save and<br/>share your own Infinity Canvas boards.</span>
                        </div>
                    </div>
                    <button className="px-[14px] py-[7px] shrink-0 bg-[#534AB7] hover:bg-[#3C3489] text-white text-[12px] font-medium rounded-[8px] transition-colors">
                        Sign up
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-black/10 flex items-center justify-between">
                <button onClick={onClose} className="text-[12px] text-neutral-500 hover:text-black transition-colors bg-transparent border-0 cursor-pointer p-0 font-medium">
                    Continue as guest →
                </button>
                <button onClick={onClose} className="px-[24px] py-[8px] bg-transparent border border-black/15 text-black text-[13px] font-medium rounded-[8px] hover:bg-[#F5F4F0] transition-colors">
                    Close
                </button>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[400px] w-full p-0 gap-0 bg-transparent border-0 shadow-none overflow-visible font-sans outline-none flex flex-col items-center">
                
                {/* Accessibility labels */}
                <div className="sr-only">
                    <DialogTitle>Share Board</DialogTitle>
                    <DialogDescription>
                        Manage collaboration settings and invite others to this board.
                    </DialogDescription>
                </div>

                {/* Main Dialog Panel Box */}
                <div className="w-[400px] bg-white border border-black/10 rounded-[12px] shadow-2xl overflow-hidden relative">
                    {variant === 'owner' && renderVariantA()}
                    {variant === 'collaborator' && renderVariantB()}
                    {variant === 'guest' && renderVariantC()}
                </div>

            </DialogContent>
        </Dialog>
    );
}
