import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Copy, Link2, Users, UserPlus, Trash2, Shield, User, Activity, Globe } from 'lucide-react';
import { toast } from 'sonner';

export function ShareModal({
    isOpen,
    onClose,
    boardId,
    boardName,
    linkAccess,
    visibility,
    isLive,
    onToggleLive,
    onUpdateAccess,
    members = [],
    onInviteMember,
    onRemoveMember,
    ownerId,
    activeUsersCount = 0,
    workspaceName,
    isOwner = false
}) {
    const [localLinkAccess, setLocalLinkAccess] = useState(linkAccess || 'none');
    const [localVisibility, setLocalVisibility] = useState(visibility || 'private');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [isSaving, setIsSaving] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdateAccess({
                linkAccess: localLinkAccess,
                visibility: localVisibility
            });
            toast.success("Share settings updated");
            onClose();
        } catch (err) {
            toast.error("Failed to update share settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        try {
            await onInviteMember(inviteEmail, inviteRole);
            toast.success(`Invited ${inviteEmail}`);
            setInviteEmail('');
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send invite");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await onRemoveMember(userId);
            toast.success("Member removed");
        } catch (err) {
            toast.error("Failed to remove member");
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    const linkAccessDescription = () => {
        switch (localLinkAccess) {
            case 'view': return 'Anyone on the internet with this link can view the board.';
            case 'edit': return 'Anyone on the internet with this link can view and edit the board.';
            case 'none':
            default: return 'Only people invited to this board can access it.';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border border-neutral-200/60 shadow-xl rounded-2xl">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 bg-neutral-50/50 border-b border-neutral-100">
                    <DialogTitle className="flex flex-col gap-1 text-xl font-semibold text-neutral-900">
                        Share "{boardName}"
                    </DialogTitle>
                    <DialogDescription className="text-sm text-neutral-500">
                        {isOwner ? "Control who can access this board" : "View access settings for this board"}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">

                    {/* SECTION 1: PEOPLE ACCESS */}
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-neutral-500" />
                            People Access
                        </Label>

                        {/* Invite Input */}
                        {isOwner && (
                            <form onSubmit={handleInvite} className="flex gap-2">
                                <div className="flex-1 relative">
                                    <UserPlus className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder="Invite by email address..."
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        type="email"
                                        className="pl-9 h-10 border-neutral-200 focus-visible:ring-indigo-500"
                                    />
                                </div>
                                <div className="w-[100px]">
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger className="h-10 border-neutral-200 shadow-sm text-sm font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                            <SelectItem value="editor">Editor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={isInviting || !inviteEmail} className="bg-neutral-900 hover:bg-neutral-800 text-white h-10 px-4 shadow-sm transition-all sm:w-auto w-full">
                                    {isInviting ? "..." : "Invite"}
                                </Button>
                            </form>
                        )}

                        {/* People List */}
                        <div className={`pt-2 ${isOwner ? 'mt-4 border-t border-neutral-100/50' : ''}`}>
                            <Label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                                People with access
                            </Label>

                            <div className="space-y-2">
                                {/* Owner */}
                                <div className="flex items-center justify-between text-sm py-1.5 group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="font-medium text-neutral-900 truncate tracking-tight">Owner</span>
                                            <span className="text-[11px] text-neutral-500 truncate">Creator</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-neutral-400">Owner</span>
                                </div>

                                {/* Members */}
                                {members.map((member) => (
                                    <div key={member.userId._id || member.userId} className="flex items-center justify-between text-sm py-1.5 group transition-colors rounded-lg hover:bg-neutral-50 -mx-2 px-2">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200/60 text-neutral-600 flex items-center justify-center shrink-0 shadow-sm">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="font-medium text-neutral-900 truncate tracking-tight">
                                                    {member.userId.name || "User"}
                                                </span>
                                                <span className="text-[11px] text-neutral-500 truncate">
                                                    {member.userId.email}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-neutral-500 capitalize">{member.role}</span>
                                            {isOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full"
                                                    onClick={() => handleRemoveMember(member.userId._id || member.userId)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {members.length === 0 && (
                                    <div className="py-5 flex flex-col items-center justify-center gap-2 text-center border-2 border-dashed border-neutral-100 rounded-xl bg-neutral-50/50 mt-2">
                                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-neutral-400" />
                                        </div>
                                        <p className="text-xs font-medium text-neutral-500">No external collaborators</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-neutral-100" />

                    {/* SECTION 2: LINK SHARING */}
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-neutral-500" />
                            Link Sharing
                        </Label>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Select value={localLinkAccess} onValueChange={setLocalLinkAccess} disabled={!isOwner}>
                                    <SelectTrigger className="w-full h-10 border-neutral-200 shadow-sm text-sm font-medium">
                                        <Globe className="w-4 h-4 text-neutral-400 mr-2" />
                                        <SelectValue placeholder="Select link access" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Restricted (Invited only)</SelectItem>
                                        <SelectItem value="view">Anyone with link can View</SelectItem>
                                        <SelectItem value="edit">Anyone with link can Edit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={handleCopyLink} className="h-10 px-4 shrink-0 shadow-sm hover:bg-neutral-50 gap-2 font-medium">
                                <Copy className="h-4 w-4 text-neutral-500" />
                                Copy Link
                            </Button>
                        </div>
                        <p className="text-xs text-neutral-500 flex items-start gap-1.5 ml-1">
                            {linkAccessDescription()}
                        </p>
                    </div>

                    <div className="h-px w-full bg-neutral-100" />

                    {/* SECTION 3: COLLABORATION & WORKSPACE */}
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-neutral-500" />
                            Collaboration Modes
                        </Label>

                        <div className="grid grid-cols-1 gap-3">
                            {/* Live Session Toggle */}
                            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="space-y-1.5 pr-4">
                                    <Label className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                                        Live Session
                                        {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse outline outline-2 outline-green-500/20"></span>}
                                    </Label>
                                    <p className="text-xs text-neutral-500 leading-snug">
                                        {isLive ? `${activeUsersCount} user${activeUsersCount !== 1 ? 's' : ''} currently online and syncing` : 'Real-time collaboration is disabled'}
                                    </p>
                                </div>
                                <Switch checked={isLive} onCheckedChange={onToggleLive} disabled={!isOwner} className={isLive ? "data-[state=checked]:bg-green-500" : ""} />
                            </div>

                            {/* Workspace Visibility Toggle */}
                            {workspaceName && (
                                <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="space-y-1.5 pr-4">
                                        <Label className="text-sm font-semibold text-neutral-900">
                                            Workspace Access
                                        </Label>
                                        <p className="text-xs text-neutral-500 leading-snug">
                                            {localVisibility === 'workspace'
                                                ? `Visible to all members of "${workspaceName}"`
                                                : `Only explicitly invited people can access`}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={localVisibility === 'workspace'}
                                        onCheckedChange={(checked) => setLocalVisibility(checked ? 'workspace' : 'private')}
                                        disabled={!isOwner}
                                        className={localVisibility === 'workspace' ? "data-[state=checked]:bg-indigo-500" : ""}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-end gap-3 rounded-b-lg">
                    {isOwner ? (
                        <>
                            <Button variant="ghost" onClick={onClose} className="font-medium hover:bg-neutral-100">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || (localLinkAccess === linkAccess && localVisibility === visibility)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium min-w-[120px] transition-all"
                            >
                                {isSaving ? "Saving..." : "Save Settings"}
                            </Button>
                        </>
                    ) : (
                        <Button variant="default" onClick={onClose} className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium min-w-[100px]">
                            Close
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

