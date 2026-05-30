import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Loader2, Github, Shapes, Palette, MousePointer2, Box } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const { login, loginWithGoogle, loginWithGithub, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Redirect already-authenticated users
    if (!authLoading && user) return <Navigate to="/dashboard" replace />;

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back!");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
            toast.success("Welcome back!");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message || "Google login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setLoading(true);
        try {
            await loginWithGithub();
            toast.success("Welcome back!");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message || "GitHub login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-sans selection:bg-indigo-500/30">
            {/* Left Decorative Side (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden bg-[#F9F9FA] border-r border-neutral-200/60 p-12">
                {/* Top Title */}
                <div className="absolute top-8 left-10 flex items-center gap-3 z-20">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-black/10 transform hover:rotate-6 transition-all duration-300 border border-slate-800">
                        <Box className="h-5 w-5 animate-pulse text-slate-100" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-neutral-900">InfiniCanvas</span>
                </div>

                {/* Subtle Excalidraw-like Dot Grid */}
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
                
                {/* Floating Interactive Elements */}
                
                {/* 1. Mini Toolbar */}
                <div className="absolute top-[25%] left-[15%] animate-bounce hover:scale-105 hover:rotate-2 transition-transform duration-300 cursor-default z-10" style={{ animationDuration: '6s' }}>
                    <div className="bg-white p-2.5 rounded-[1.25rem] border-2 border-neutral-200 shadow-sm flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100"><MousePointer2 className="w-5 h-5 text-indigo-600" strokeWidth={2.5} /></div>
                        <div className="w-10 h-10 rounded-xl hover:bg-neutral-50 flex items-center justify-center transition-colors"><Shapes className="w-5 h-5 text-neutral-600" strokeWidth={2} /></div>
                        <div className="w-10 h-10 rounded-xl hover:bg-neutral-50 flex items-center justify-center transition-colors"><Palette className="w-5 h-5 text-neutral-600" strokeWidth={2} /></div>
                    </div>
                </div>

                {/* 2. Floating Sticky Note */}
                <div className="absolute top-[20%] right-[15%] animate-bounce hover:-translate-y-2 hover:rotate-0 transition-all duration-300 cursor-default z-10" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                    <div className="w-36 h-36 bg-[#FFF9C4] rotate-6 rounded-2xl border-2 border-[#F0E68C] shadow-sm p-5 flex flex-col gap-3">
                        <div className="w-16 h-2.5 bg-[#E6DA73] rounded-full"></div>
                        <div className="w-24 h-2.5 bg-[#E6DA73] rounded-full"></div>
                        <div className="w-20 h-2.5 bg-[#E6DA73] rounded-full"></div>
                    </div>
                </div>

                {/* 3. Multiplayer Cursor */}
                <div className="absolute bottom-[30%] right-[22%] animate-pulse hover:scale-110 transition-transform duration-300 cursor-default z-10" style={{ animationDuration: '4s' }}>
                    <div className="relative">
                        <MousePointer2 className="w-10 h-10 text-rose-500 fill-rose-500 -rotate-12 drop-shadow-md" />
                        <div className="absolute top-8 left-8 bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm border border-rose-600">
                            Alex editing...
                        </div>
                    </div>
                </div>

                {/* 4. Shape Element */}
                <div className="absolute bottom-[20%] left-[20%] animate-bounce hover:scale-110 transition-transform duration-300 cursor-default z-10" style={{ animationDuration: '7s', animationDelay: '0.5s' }}>
                    <div className="w-28 h-28 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center -rotate-12 shadow-sm">
                        <div className="w-14 h-14 bg-white rounded-full border-2 border-emerald-100"></div>
                    </div>
                </div>

                <div className="relative z-10 max-w-md text-center space-y-6 mt-8 bg-white/50 backdrop-blur-sm p-8 rounded-[2rem] border border-white/50 shadow-sm">
                    <h1 className="text-[44px] font-black text-neutral-900 tracking-tight leading-[1.1]">
                        Think visually.<br/>Work infinitely.
                    </h1>
                    <p className="text-[16px] text-neutral-500 font-medium leading-relaxed max-w-[320px] mx-auto">
                        Join thousands of creators building flowcharts, wireframes, and mind maps on an infinite spatial canvas.
                    </p>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-white relative">
                <div className="w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-500">
                    <div className="lg:hidden flex justify-start mb-8 items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-black/10 transform hover:rotate-6 transition-all duration-300 border border-slate-800">
                            <Box className="h-5 w-5 animate-pulse text-slate-100" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-neutral-900">InfiniCanvas</span>
                    </div>
                    
                    <div className="mb-10 text-left">
                        <p className="text-indigo-600 mb-2 text-[16px] font-black tracking-wide">Hi there! 👋</p>
                        <h2 className="text-[36px] font-extrabold text-neutral-900 tracking-tight leading-tight">Get started</h2>
                        <p className="text-neutral-500 mt-2 text-[15px] font-medium">Choose how you want to sign in</p>
                    </div>

                    <div className="flex flex-col gap-3 mb-8">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full h-12 bg-white border-2 border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleGithubLogin}
                            disabled={loading}
                            className="w-full h-12 bg-white border-2 border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => navigate('/dashboard')}
                            disabled={loading}
                            className="w-full h-12 bg-white border-2 border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            Continue without account
                        </Button>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-2 border-neutral-100" />
                        </div>
                        <div className="relative flex justify-center text-[12px] uppercase tracking-widest font-bold">
                            <span className="bg-white px-4 text-neutral-400">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2.5">
                            <label className="text-[12px] font-bold text-neutral-700 tracking-wide">Email</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                className="bg-[#F9F9FA] border-2 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:bg-white focus:ring-0 h-12 rounded-2xl transition-all shadow-none px-4 font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[12px] font-bold text-neutral-700 tracking-wide">Password</label>
                                <a href="#" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Forgot password?</a>
                            </div>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="bg-[#F9F9FA] border-2 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:bg-white focus:ring-0 h-12 rounded-2xl transition-all shadow-none px-4 font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all mt-8 text-[15px] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
                        </Button>
                    </form>

                    <div className="mt-10 text-left text-[14px] font-medium text-neutral-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline underline-offset-4">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
