import { useState, useEffect } from 'react';
import { UserProfileMenu } from '../UserProfileMenu';
import { NotificationBell } from '../NotificationBell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function TeamView() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // For direct invites
    const [myBoards, setMyBoards] = useState([]);
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [invitingUserId, setInvitingUserId] = useState(null);

    // Fetch user's boards for the invite dropdown
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const res = await api.get('/boards');
                setMyBoards(res.data.data || []);
                if (res.data.data && res.data.data.length > 0) {
                    setSelectedBoardId(res.data.data[0]._id);
                }
            } catch (err) {
                console.error("Failed to fetch boards", err);
            }
        };
        fetchBoards();
    }, []);

    useEffect(() => {
        const searchUsers = async () => {
            if (debouncedSearch.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await api.get(`/users/search?q=${encodeURIComponent(debouncedSearch)}`);
                setSearchResults(res.data.data || []);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };
        searchUsers();
    }, [debouncedSearch]);

    const handleInvite = async (userId) => {
        if (!selectedBoardId) {
            toast.error("Please select a board first.");
            return;
        }
        setInvitingUserId(userId);
        try {
            const userToInvite = searchResults.find(u => u._id === userId);
            await api.post(`/boards/${selectedBoardId}/members`, {
                email: userToInvite.email,
                role: 'editor' // Default to editor for direct invites
            });
            toast.success(`Invitation sent to ${userToInvite.name}!`);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to invite user");
        } finally {
            setInvitingUserId(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50/50 overflow-hidden">
            {/* Contextual Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 sticky top-0 bg-white/80 backdrop-blur-md border-b border-neutral-200">
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-neutral-400" />
                    <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
                        Team
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <UserProfileMenu />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 z-10">
                <div className="max-w-4xl mx-auto space-y-10">

                    {/* Global User Search & Add Member */}
                    <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm spatial-card">
                        <div className="flex items-center gap-2 mb-6 text-neutral-800">
                            <UserPlus className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold">Add Member</h2>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    className="pl-9 bg-neutral-50/50 border-neutral-200 focus-visible:ring-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-neutral-400" />}
                            </div>
                            <div className="w-full md:w-[260px]">
                                <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                                    <SelectTrigger className="bg-neutral-50/50 border-neutral-200">
                                        <SelectValue placeholder="Select Board to Invite" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myBoards.map(board => (
                                            <SelectItem key={board._id} value={board._id}>
                                                {board.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchQuery.length >= 2 && (
                            <div className="border border-neutral-100 rounded-xl overflow-hidden bg-neutral-50/30">
                                {searchResults.length === 0 && !isSearching ? (
                                    <div className="p-8 text-center text-sm text-neutral-500">
                                        No users found matching "{searchQuery}"
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-neutral-100">
                                        {searchResults.map(result => {
                                            if (result._id === user?.id) return null; // Don't show self
                                            return (
                                                <li key={result._id} className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                                                            {result.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-neutral-800">{result.name}</p>
                                                            <p className="text-xs text-neutral-500">{result.email}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleInvite(result._id)}
                                                        disabled={invitingUserId === result._id}
                                                        className="bg-neutral-900 hover:bg-neutral-800 text-white min-w-[80px]"
                                                    >
                                                        {invitingUserId === result._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                                                    </Button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                    </section>

                    {/* All Members Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section>
                            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                Online Members
                            </h2>
                            <div className="bg-white border border-neutral-200 rounded-2xl p-2 spatial-card">
                                {/* Dummy Active Member */}
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100/50 hover:bg-neutral-100/50 transition-colors">
                                    <div className="relative">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                                            {user ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-500"></span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-800">{user ? user.name : 'You'}</p>
                                        <p className="text-xs text-neutral-500">Online</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">Pending Invitations</h2>
                            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-neutral-300 bg-white/50 h-[100px]">
                                <p className="text-sm text-neutral-500">No pending invitations.</p>
                            </div>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
}
