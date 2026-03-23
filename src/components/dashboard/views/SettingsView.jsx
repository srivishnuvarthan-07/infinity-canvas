import React, { useState, useEffect } from 'react';
import { UserProfileMenu } from '../UserProfileMenu';
import { NotificationBell } from '../NotificationBell';
import { Settings, Star, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AIKeySection } from '@/components/profile/AIKeySection';
import { DangerZone } from '@/components/profile/DangerZone';
import authService from '@/services/auth.service';
import { toast } from 'sonner';

const COLORS = [
    { id: 'purple', hex: '#7F77DD' },
    { id: 'green', hex: '#1D9E75' },
    { id: 'coral', hex: '#D85A30' },
    { id: 'blue', hex: '#378ADD' },
    { id: 'amber', hex: '#BA7517' },
    { id: 'pink', hex: '#D4537E' },
    { id: 'dark', hex: '#444441' }
];

export default function SettingsView() {
    const { user, checkAuth } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [savedState, setSavedState] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [avatarColor, setAvatarColor] = useState('#7F77DD');
    const [defaultStorage, setDefaultStorage] = useState('cloud');

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

    return (
        <div className="flex flex-col h-full overflow-hidden selection:bg-indigo-500/30">
            {/* Contextual Header */}
            <header className="h-24 px-10 flex items-center justify-between sticky top-4 m-4 bg-[#FAFAFA]/80 backdrop-blur-md z-10 border border-black/5 rounded-3xl shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-neutral-400" />
                    <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
                        Settings
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <UserProfileMenu />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 z-10">
                <div className="max-w-3xl mx-auto">
                    
                    {/* Tab Switcher */}
                    <div className="flex gap-2 mb-8">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${activeTab === 'profile' ? 'bg-neutral-900 text-white' : 'bg-transparent border border-black/10 text-neutral-500 hover:text-neutral-900'}`}
                        >
                            My profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${activeTab === 'settings' ? 'bg-neutral-900 text-white' : 'bg-transparent border border-black/10 text-neutral-500 hover:text-neutral-900'}`}
                        >
                            Profile settings
                        </button>
                    </div>

                    {activeTab === 'profile' && (
                        <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden mb-8">
                            {/* Hero Section */}
                            <div className="flex items-center p-6 border-b border-black/5">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] font-medium shrink-0 relative group cursor-pointer"
                                    style={{ backgroundColor: avatarColor }}
                                    onClick={() => setActiveTab('settings')}
                                >
                                    {user?.name?.[0]?.toUpperCase()}
                                    <div className="absolute inset-0 bg-black/35 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Pencil className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 ml-4">
                                    <h2 className="text-[15px] font-medium text-neutral-900">{user?.name}</h2>
                                    <p className="text-[12px] text-neutral-500 mt-0.5">{user?.email}</p>
                                    <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-[#EEEDFE] border border-[#CECBF6] text-[#3C3489]">
                                        <Star className="w-2.5 h-2.5 fill-[#534AB7] text-[#534AB7]" />
                                        <span className="text-[10px] font-medium">Pro plan</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('settings')}
                                    className="px-3 py-1.5 border border-black/10 rounded-md text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                                >
                                    Edit profile
                                </button>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 border-b border-black/5">
                                <div className="p-4 border-r border-black/5">
                                    <div className="text-[18px] font-medium text-neutral-900">12</div>
                                    <div className="text-[11px] text-neutral-500 mt-0.5">Boards</div>
                                </div>
                                <div className="p-4 border-r border-black/5">
                                    <div className="text-[18px] font-medium text-neutral-900">34</div>
                                    <div className="text-[11px] text-neutral-500 mt-0.5">AI diagrams</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-[18px] font-medium text-neutral-900">18</div>
                                    <div className="text-[11px] text-neutral-500 mt-0.5">Library shapes</div>
                                </div>
                            </div>

                            {/* Info Rows */}
                            <div className="flex justify-between items-center px-6 py-3.5 border-b border-black/5">
                                <span className="text-[12px] text-neutral-500">Full name</span>
                                <span className="text-[12px] font-medium text-neutral-900">{user?.name}</span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-3.5 border-b border-black/5">
                                <span className="text-[12px] text-neutral-500">Email</span>
                                <span className="text-[12px] font-medium text-neutral-900">{user?.email}</span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-3.5 border-b border-black/5">
                                <span className="text-[12px] text-neutral-500">Plan</span>
                                <span className="text-[12px] font-medium text-neutral-900">Pro</span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-3.5 border-b border-black/5">
                                <span className="text-[12px] text-neutral-500">Member since</span>
                                <span className="text-[12px] font-normal text-neutral-500">March 2026</span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-3.5 border-b border-black/5">
                                <span className="text-[12px] text-neutral-500">Default storage</span>
                                <span className="text-[12px] font-normal text-neutral-500 capitalize">{user?.defaultStorage || 'cloud'}</span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-3.5">
                                <span className="text-[12px] text-neutral-500">AI provider</span>
                                <span className="text-[12px] font-normal text-neutral-500">
                                    {user?.aiConfig?.defaultProvider === 'groq' ? 'Groq' : 
                                     user?.aiConfig?.defaultProvider === 'openai' ? 'OpenAI' :
                                     user?.aiConfig?.defaultProvider === 'anthropic' ? 'Anthropic' : 'Gemini'}
                                    {' '}({user?.aiConfig?.freeUsage?.count || 0} used)
                                </span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <>
                        <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden mb-8">
                            {/* Hero Preview */}
                            <div className="flex items-center p-6 border-b border-black/5 bg-neutral-50/50">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] font-medium shrink-0 relative group"
                                    style={{ backgroundColor: avatarColor }}
                                >
                                    {(name || '?')[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 ml-4">
                                    <h2 className="text-[15px] font-medium text-neutral-900">{name || 'Your Name'}</h2>
                                    <p className="text-[12px] text-neutral-500 mt-0.5">{user?.email}</p>
                                    <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-[#EEEDFE] border border-[#CECBF6] text-[#3C3489]">
                                        <Star className="w-2.5 h-2.5 fill-[#534AB7] text-[#534AB7]" />
                                        <span className="text-[10px] font-medium">Pro plan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Avatar Color Picker */}
                            <div className="p-6 border-b border-black/5">
                                <label className="block text-[11px] font-medium text-neutral-500 mb-3">Avatar color</label>
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleColorPick(c.hex)}
                                            className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${avatarColor === c.hex ? 'ring-2 ring-offset-2 ring-neutral-900' : ''}`}
                                            style={{ backgroundColor: c.hex }}
                                            aria-label={`Select ${c.id} color`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Full Name Field */}
                            <div className="p-6 border-b border-black/5">
                                <label className="block text-[11px] font-medium text-neutral-500 tracking-[0.04em] mb-2">Full name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="flex-1 bg-neutral-50 border border-black/5 text-[13px] text-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] transition-all"
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={loading || name === user?.name}
                                        className={`shrink-0 text-[12px] font-medium rounded-lg px-4 py-2 transition-colors ${
                                            savedState 
                                            ? 'bg-[#EAF3DE] border border-[#C0DD97] text-[#3B6D11]' 
                                            : 'bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {savedState ? 'Saved' : 'Save'}
                                    </button>
                                </div>
                            </div>

                            {/* Email Address Field */}
                            <div className="p-6 border-b border-black/5">
                                <label className="block text-[11px] font-medium text-neutral-500 mb-2">Email address</label>
                                <input
                                    type="text"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full bg-neutral-50 border border-black/5 text-[13px] text-neutral-900 rounded-lg px-3 py-2 opacity-50 cursor-not-allowed"
                                />
                                <p className="text-[11px] text-neutral-500 mt-1.5">Email can be changed in account settings.</p>
                            </div>

                            {/* Default Storage Field */}
                            <div className="p-6">
                                <label className="block text-[11px] font-medium text-neutral-500 mb-2">Default new board storage</label>
                                <select
                                    value={defaultStorage}
                                    onChange={(e) => handleStorageChange(e.target.value)}
                                    className="w-full bg-neutral-50 border border-black/5 text-[13px] text-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:border-[#7F77DD] focus:ring-1 focus:ring-[#7F77DD] cursor-pointer appearance-none transition-all"
                                >
                                    <option value="cloud">Cloud — sync across devices</option>
                                    <option value="local">Local — store in this browser</option>
                                </select>
                                <p className="text-[11px] text-neutral-500 mt-1.5">Where new boards are saved when you click New board.</p>
                            </div>
                        </div>
                        
                        {/* Extra Settings Component Sections */}
                        <AIKeySection />
                        <DangerZone />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
