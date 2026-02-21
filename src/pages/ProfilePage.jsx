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
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.updateProfile({ name });
            await checkAuth(); // Refresh user state
            toast.success("Profile updated");
        } catch (err) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen w-full bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center px-8 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            <main className="max-w-2xl mx-auto py-12 px-6">
                <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

                {/* Profile Card */}
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 mb-8">
                    <div className="flex items-center gap-6 mb-8">
                        <Avatar className="w-20 h-20 border-2 border-indigo-500/20">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-indigo-500 text-xl font-bold text-white">
                                {user.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                            <p className="text-neutral-500 text-sm">{user.email}</p>
                            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                                <User className="w-3 h-3" />
                                Pro Plan
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-6 max-w-md">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Full Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-black/20 border-white/10 text-white focus:bg-black/40 focus:border-indigo-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Email Address</label>
                            <Input
                                value={email}
                                disabled
                                className="bg-white/5 border-transparent text-neutral-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-neutral-600">Email cannot be changed locally.</p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-white text-black hover:bg-neutral-200 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-500/10 rounded-2xl p-8 bg-red-500/5">
                    <h3 className="text-red-400 font-semibold mb-2">Danger Zone</h3>
                    <p className="text-red-500/60 text-sm mb-6">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none shadow-none">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                    </Button>
                </div>
            </main>
        </div>
    );
}
