import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

export function SignupModal({ isOpen, onOpenChange, onSuccess }) {
    const { register, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState('signup'); // 'signup' | 'login'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'signup') {
                await register(name, email, password);
                toast.success("Account created successfully!");
            } else {
                await login(email, password);
                toast.success("Logged in successfully!");
            }
            onOpenChange(false);
            if (onSuccess) {
                setTimeout(onSuccess, 100);
            }
            
            // Clear form
            setName('');
            setEmail('');
            setPassword('');
        } catch (err) {
            toast.error(err.response?.data?.error || `${mode === 'signup' ? 'Registration' : 'Login'} failed`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl">
                <div className="p-8">
                    <DialogHeader className="flex flex-col items-center mb-6 pt-2 space-y-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center shadow-sm border border-black/5 mb-4">
                            <span className="text-indigo-600 font-bold text-xl">∞</span>
                        </div>
                        <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight text-center">
                            {mode === 'signup' ? 'Create a free account' : 'Welcome back'}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 mt-1.5 text-sm text-center">
                            {mode === 'signup' 
                                ? 'Join to save custom shapes and generate with AI.' 
                                : 'Sign in to access your library and AI tools.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Full Name</label>
                                <Input
                                    type="text"
                                    placeholder="John Doe"
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 h-11 rounded-xl transition-all"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Email</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 h-11 rounded-xl transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Password</label>
                            <Input
                                type="password"
                                placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
                                className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 h-11 rounded-xl transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 rounded-xl transition-all mt-4"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'signup' ? "Sign Up" : "Sign In")}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm font-medium text-neutral-500">
                        {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
                        <button 
                            type="button" 
                            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                            className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                            {mode === 'signup' ? 'Sign in' : 'Create one'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
