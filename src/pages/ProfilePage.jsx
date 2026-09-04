import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBoardStore } from '@/hooks/useBoardStore';
import { useLibraryStore } from '@/hooks/useLibraryStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import authService from '@/services/auth.service';
import { AIKeySection } from '@/components/profile/AIKeySection';
import { DangerZone } from '@/components/profile/DangerZone';

const COLORS = [
    { id: 'purple', hex: '#7F77DD' },
    { id: 'green', hex: '#1D9E75' },
    { id: 'coral', hex: '#D85A30' },
    { id: 'blue', hex: '#378ADD' },
    { id: 'amber', hex: '#BA7517' },
    { id: 'pink', hex: '#D4537E' },
    { id: 'dark', hex: '#444441' }
];

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();
    const { localBoards, cloudBoards } = useBoardStore();
    const { libraryItems } = useLibraryStore();

    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [savedState, setSavedState] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [avatarColor, setAvatarColor] = useState('#7F77DD');
    const [defaultStorage, setDefaultStorage] = useState('cloud');

    // Real Stats
    const boardsCount = localBoards.length + cloudBoards.length;
    const aiDiagramCount = useMemo(() => libraryItems.filter(i => i.source === 'AI').length, [libraryItems]);
    const libraryShapeCount = libraryItems.length;

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setAvatarColor(user.avatarColor || '#7F77DD');
            setDefaultStorage(user.defaultStorage || 'cloud');
        }
    }, [user]);

    const handleSaveName = async () => {
        setLoading(true);
        try {
            await authService.updateProfile({ name });
            await checkAuth();
            setSavedState(true);
            setTimeout(() => setSavedState(false), 2000);
        } catch (err) {
            toast.error("Failed to save name");
        } finally {
            setLoading(false);
        }
    };

    const handleColorPick = async (hex) => {
        setAvatarColor(hex);
        try {
            await authService.updateProfile({ avatarColor: hex });
            await checkAuth();
        } catch (err) {
            toast.error("Failed to save avatar color");
        }
    };

    const handleStorageChange = async (val) => {
        setDefaultStorage(val);
        try {
            await authService.updateProfile({ defaultStorage: val });
            await checkAuth();
        } catch (err) {
            toast.error("Failed to save default storage");
        }
    };

    if (!user) return null;

    return (
        <div className="relative min-h-screen w-full bg-[#FAF9F5] text-neutral-800 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
            {/* ── SPATIAL BACKDROP ─────────────────────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAF9F5]">
                <div 
                    className="absolute inset-0 opacity-90"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 15% 35%, rgba(99, 102, 241, 0.08) 0%, transparent 45%),
                            radial-gradient(circle at 85% 10%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)
                        `
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(#00000005_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-80" />
            </div>

            {/* Header */}
            <div className="h-20 flex items-center px-8 relative z-10 w-full max-w-4xl mx-auto">
                <Link to="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-neutral-500 hover:text-indigo-600 transition-colors bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Canvas
                </Link>
            </div>

            <main className="flex-1 overflow-y-auto relative z-10 w-full max-w-2xl mx-auto px-6 pb-24">
                
                {/* Title Area */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Your Space</h1>
                    <p className="text-sm font-medium text-neutral-500 mt-2">Manage your identity and workspace preferences.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center mb-10">
                    <div className="bg-white/60 backdrop-blur-md border border-white/80 p-1 rounded-full inline-flex shadow-sm">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all duration-300 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-neutral-500 hover:text-neutral-900'}`}
                        >
                            My profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('settings')}
                            className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all duration-300 ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-neutral-500 hover:text-neutral-900'}`}
                        >
                            Profile settings
                        </button>
                    </div>
                </div>

                {activeTab === 'profile' && (
                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden mb-8 transition-all hover:bg-white/80">
                        {/* Hero Section */}
                        <div className="flex flex-col md:flex-row items-center md:items-start p-8 border-b border-white/80 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full pointer-events-none" />
                            
                            <div 
                                className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shrink-0 relative group cursor-pointer shadow-lg shadow-indigo-500/10 transition-transform hover:scale-105 hover:rotate-3"
                                style={{ backgroundColor: avatarColor }}
                                onClick={() => setActiveTab('settings')}
                            >
                                {user.name?.[0]?.toUpperCase()}
                                <div className="absolute inset-0 bg-black/35 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                    <Pencil className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            
                            <div className="flex-1 mt-6 md:mt-0 md:ml-8 text-center md:text-left z-10 flex flex-col justify-center h-full min-h-[96px]">
                                <h2 className="text-2xl font-extrabold text-neutral-900">{user.name}</h2>
                                <p className="text-sm font-medium text-neutral-500 mt-1">{user.email}</p>
                                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm">
                                        <Star className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Pro plan</span>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('settings')}
                                        className="inline-flex items-center px-4 py-1 border border-neutral-200/80 rounded-full text-[11px] font-bold text-neutral-600 bg-white hover:bg-neutral-50 hover:text-indigo-600 transition-colors shadow-sm"
                                    >
                                        Edit profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 border-b border-white/80 bg-white/20">
                            <div className="p-6 border-r border-white/80 text-center hover:bg-white/40 transition-colors">
                                <div className="text-3xl font-black text-neutral-900 tracking-tight">{boardsCount}</div>
                                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Boards</div>
                            </div>
                            <div className="p-6 border-r border-white/80 text-center hover:bg-white/40 transition-colors">
                                <div className="text-3xl font-black text-neutral-900 tracking-tight">{aiDiagramCount}</div>
                                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">AI diagrams</div>
                            </div>
                            <div className="p-6 text-center hover:bg-white/40 transition-colors">
                                <div className="text-3xl font-black text-neutral-900 tracking-tight">{libraryShapeCount}</div>
                                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Library shapes</div>
                            </div>
                        </div>

                        {/* Info Rows */}
                        <div className="flex flex-col">
                            <InfoRow label="Full name" value={user.name} />
                            <InfoRow label="Email" value={user.email} />
                            <InfoRow label="Plan" value="Pro" />
                            <InfoRow label="Member since" value="March 2026" />
                            <InfoRow label="Default storage" value={<span className="capitalize">{user.defaultStorage}</span>} />
                            <InfoRow label="AI provider" value={
                                <>
                                    {user.aiConfig?.defaultProvider === 'groq' ? 'Groq' : 
                                     user.aiConfig?.defaultProvider === 'openai' ? 'OpenAI' :
                                     user.aiConfig?.defaultProvider === 'anthropic' ? 'Anthropic' : 'Gemini'}
                                    <span className="opacity-60 ml-1">({user.aiConfig?.freeUsage?.count || 0} used)</span>
                                </>
                            } isLast />
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8">
                        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all hover:bg-white/80">
                            {/* Hero Preview */}
                            <div className="flex items-center p-8 border-b border-white/80 bg-gradient-to-br from-white/40 to-transparent">
                                <div 
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md shadow-black/5"
                                    style={{ backgroundColor: avatarColor }}
                                >
                                    {(name || '?')[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 ml-6">
                                    <h2 className="text-lg font-extrabold text-neutral-900">{name || 'Your Name'}</h2>
                                    <p className="text-xs font-medium text-neutral-500 mt-1">{user.email}</p>
                                </div>
                            </div>

                            {/* Avatar Color Picker */}
                            <div className="p-8 border-b border-white/80 hover:bg-white/20 transition-colors">
                                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Avatar color</label>
                                <div className="flex gap-4">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleColorPick(c.hex)}
                                            className={`w-8 h-8 rounded-full shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md ${avatarColor === c.hex ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : 'ring-1 ring-black/5'}`}
                                            style={{ backgroundColor: c.hex }}
                                            aria-label={`Select ${c.id} color`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Full Name Field */}
                            <div className="p-8 border-b border-white/80 hover:bg-white/20 transition-colors">
                                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Full name</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="flex-1 bg-white/80 backdrop-blur-sm border border-neutral-200/80 text-[14px] font-medium text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={loading || name === user.name}
                                        className={`shrink-0 text-[13px] font-bold rounded-xl px-6 py-3 transition-all duration-300 shadow-sm ${
                                            savedState 
                                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-0.5'
                                        }`}
                                    >
                                        {savedState ? 'Saved!' : 'Save changes'}
                                    </button>
                                </div>
                            </div>

                            {/* Email Address Field */}
                            <div className="p-8 border-b border-white/80 hover:bg-white/20 transition-colors">
                                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Email address</label>
                                <input
                                    type="text"
                                    value={user.email}
                                    disabled
                                    className="w-full bg-neutral-100/50 border border-neutral-200/50 text-[14px] font-medium text-neutral-900 rounded-xl px-4 py-3 opacity-60 cursor-not-allowed shadow-inner"
                                />
                                <p className="text-[11px] font-medium text-neutral-400 mt-2">Email can be changed in account settings.</p>
                            </div>

                            {/* Default Storage Field */}
                            <div className="p-8 hover:bg-white/20 transition-colors">
                                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Default new board storage</label>
                                <select
                                    value={defaultStorage}
                                    onChange={(e) => handleStorageChange(e.target.value)}
                                    className="w-full bg-white/80 backdrop-blur-sm border border-neutral-200/80 text-[14px] font-medium text-neutral-900 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all shadow-sm"
                                >
                                    <option value="cloud">Cloud — sync across devices</option>
                                    <option value="local">Local — store in this browser</option>
                                </select>
                                <p className="text-[11px] font-medium text-neutral-400 mt-2">Where new boards are saved when you click New board.</p>
                            </div>
                        </div>
                        
                        {/* Extra Settings Component Sections */}
                        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden p-8 transition-all hover:bg-white/80">
                            <AIKeySection />
                        </div>
                        
                        <div className="bg-red-50/40 backdrop-blur-xl border border-red-100/60 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden p-8 transition-all hover:bg-red-50/60">
                            <DangerZone />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function InfoRow({ label, value, isLast }) {
    return (
        <div className={`flex justify-between items-center px-8 py-5 hover:bg-white/40 transition-colors ${!isLast ? 'border-b border-white/80' : ''}`}>
            <span className="text-[13px] font-bold text-neutral-400">{label}</span>
            <span className="text-[13px] font-extrabold text-neutral-800">{value}</span>
        </div>
    );
}
