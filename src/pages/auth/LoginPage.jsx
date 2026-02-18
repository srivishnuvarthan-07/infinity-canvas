import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back!");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{
                    backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}
            />
            
            {/* Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />

            <div className="w-full max-w-md p-8 rounded-2xl bg-neutral-900/50 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                        <span className="text-white font-bold text-xl">∞</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
                    <p className="text-neutral-400 mt-2 text-sm">Sign in to your Infinity Canvas account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-neutral-300 uppercase tracking-wide">Email</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            className="bg-black/20 border-white/10 text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:bg-black/40 h-10 transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-neutral-300 uppercase tracking-wide">Password</label>
                            <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</a>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-black/20 border-white/10 text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:bg-black/40 h-10 transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-900/20 transition-all mt-6"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-neutral-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
