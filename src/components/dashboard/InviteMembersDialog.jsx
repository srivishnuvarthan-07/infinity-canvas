import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Mail, Plus, X, User, Shield, Eye } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const roles = [
    { value: "admin", label: "Admin", icon: Shield, color: "text-indigo-400" },
    { value: "editor", label: "Editor", icon: User, color: "text-blue-400" },
    { value: "viewer", label: "Viewer", icon: Eye, color: "text-emerald-400" },
];

export function InviteMembersDialog({ children }) {
    const [emails, setEmails] = useState([]);
    const [currentEmail, setCurrentEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState(roles[1]); // Editor default
    const [isOpen, setIsOpen] = useState(false);

    const handleKeyDown = (e) => {
        if (["Enter", ",", " "].includes(e.key)) {
            e.preventDefault();
            if (currentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
                if (!emails.includes(currentEmail)) {
                    setEmails([...emails, currentEmail]);
                }
                setCurrentEmail("");
            }
        }
    };

    const removeEmail = (email) => {
        setEmails(emails.filter((e) => e !== email));
    };

    const handleConfirm = () => {
        // Mock invite logic
        console.log("Inviting:", emails, "as", selectedRole.value);
        setIsOpen(false);
        setEmails([]);
        setCurrentEmail("");
    };

    // Mock existing members
    const members = [
        { id: 1, name: "Vishnu V", role: "Owner", avatar: "", initials: "VV" },
        { id: 2, name: "Arun Kumar", role: "Editor", avatar: "", initials: "AK" },
    ];

    const CurrentRoleIcon = selectedRole.icon;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-neutral-900 border border-white/10 text-neutral-200 shadow-2xl p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-4 border-b border-white/5 bg-white/[0.02]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold tracking-tight">Invite Team Members</DialogTitle>
                        <DialogDescription className="text-neutral-500 mt-1.5">
                            Invite colleagues to collaborate on this workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 flex flex-col gap-4">
                        {/* Email Input Area */}
                        <div className="min-h-[44px] px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all flex flex-wrap gap-2 items-center">
                            {emails.map((email) => (
                                <span key={email} className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs text-neutral-200 animate-in fade-in zoom-in-95 duration-100">
                                    {email}
                                    <button type="button" onClick={() => removeEmail(email)} className="text-neutral-400 hover:text-white">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-neutral-600 min-w-[120px]"
                                placeholder={emails.length === 0 ? "Enter email addresses..." : ""}
                                value={currentEmail}
                                onChange={(e) => setCurrentEmail(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Role Selector & Invite Button */}
                        <div className="flex gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-[140px] justify-between border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-neutral-300">
                                        <div className="flex items-center gap-2">
                                            <CurrentRoleIcon className={cn("w-4 h-4", selectedRole.color)} />
                                            <span>{selectedRole.label}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[140px] bg-neutral-900 border-white/10 text-neutral-300">
                                    {roles.map((role) => (
                                        <DropdownMenuItem
                                            key={role.value}
                                            onClick={() => setSelectedRole(role)}
                                            className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer"
                                        >
                                            <role.icon className={cn("w-4 h-4", role.color)} />
                                            {role.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={handleConfirm} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20">
                                Send Invites
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Member List */}
                <div className="bg-black/20 p-6 pt-4">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Current Members</h4>
                    <div className="space-y-4 max-h-[200px] overflow-y-auto">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-white/10">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="bg-neutral-800 text-xs text-neutral-400">
                                            {member.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-neutral-200">{member.name}</span>
                                        <span className="text-[11px] text-neutral-500">{member.role === 'Owner' ? 'workspace owner' : member.role.toLowerCase()}</span>
                                    </div>
                                </div>
                                <div className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors">
                                    {member.role}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Copy Link Footer */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                            <div className="h-4 w-4 text-indigo-400 rotate-45">🔗</div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-200">Copy Invite Link</p>
                            <p className="text-xs text-neutral-500">Anyone with the link can view</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs h-8 text-neutral-400 hover:text-white hover:bg-white/5">
                            Copy Link
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
