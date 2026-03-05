import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, Loader2, User, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import authService from '@/services/auth.service';

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        if (user) setName(user.name);
    }, [user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.updateProfile({ name });
            await checkAuth();
            toast.success("Profile updated");
        } catch (err) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen w-full dashboard-bg text-neutral-800 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <div className="h-20 border-b border-black/5 flex items-center px-8 bg-[#F6F5F3]/80 backdrop-blur-md sticky top-0 z-10">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            <main className="max-w-2xl mx-auto py-12 px-6">
                <h1 className="text-2xl font-bold text-neutral-900 mb-8 tracking-tight">Account Settings</h1>

                {/* Profile Card */}
                <div className="spatial-card p-10 mb-8">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-black/5">
                        <Avatar className="w-20 h-20 shadow-sm border border-black/5">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-600 text-2xl font-bold">
                                {user.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">{user.name}</h2>
                            <p className="text-neutral-500 text-sm mt-0.5">{user.email}</p>
                            <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-wide uppercase border border-indigo-100 shadow-sm">
                                <User className="w-3 h-3" />
                                Pro Plan
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-6 max-w-md">
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Full Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-neutral-50 border-black/5 text-neutral-900 focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 h-11 rounded-xl transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
                            <Input
                                value={user.email}
                                disabled
                                className="bg-neutral-100/50 border-black/5 text-neutral-500 cursor-not-allowed h-11 rounded-xl shadow-none"
                            />
                            <p className="text-[11px] font-medium text-neutral-400">Email cannot be changed locally.</p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-neutral-900 text-white hover:bg-neutral-800 mt-4 rounded-xl h-10 px-5 shadow-sm font-medium"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="spatial-card p-10 border border-red-500/10 bg-red-50/50">
                    <h3 className="text-red-600 font-semibold mb-2">Danger Zone</h3>
                    <p className="text-red-500/80 text-sm mb-6 font-medium">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 shadow-none border border-red-100 rounded-xl h-10 px-5 font-medium">
                        <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                        Delete Account
                    </Button>
                </div>
            </main>
        </div>
    );
}
