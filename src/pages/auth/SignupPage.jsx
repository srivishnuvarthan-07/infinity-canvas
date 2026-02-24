import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
    const { register, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Redirect already-authenticated users
    if (!authLoading && user) return <Navigate to="/dashboard" replace />;

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(name, email, password);
            toast.success("Account created successfully!");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center dashboard-bg relative overflow-hidden font-sans selection:bg-indigo-500/30">
            <div className="w-full max-w-md p-10 spatial-card relative z-10 animate-in fade-in zoom-in-95 duration-300 my-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center shadow-sm border border-black/5 mb-5">
                        <span className="text-indigo-600 font-bold text-xl">∞</span>
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Create an account</h1>
                    <p className="text-neutral-500 mt-2 text-sm text-center">Join Calm Spatial Studio to start creating</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Full Name</label>
                        <Input
                            type="text"
                            placeholder="John Doe"
                            className="bg-neutral-50 border-black/5 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 h-11 rounded-xl transition-all shadow-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Email</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            className="bg-neutral-50 border-black/5 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 h-11 rounded-xl transition-all shadow-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Password</label>
                        <Input
                            type="password"
                            placeholder="Create a password"
                            className="bg-neutral-50 border-black/5 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 h-11 rounded-xl transition-all shadow-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-md shadow-black/5 rounded-xl transition-all mt-6"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm font-medium text-neutral-500 border-t border-black/5 pt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
