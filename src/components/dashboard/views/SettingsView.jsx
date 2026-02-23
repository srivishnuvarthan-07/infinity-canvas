import { UserProfileMenu } from '../UserProfileMenu';
import { NotificationBell } from '../NotificationBell';
import { Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsView() {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Contextual Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 sticky top-0 bg-[#F6F5F3]/80 backdrop-blur-md border-b border-black/5">
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
                <div className="max-w-3xl mx-auto space-y-8">

                    <section className="spatial-card p-10">
                        <h2 className="text-lg font-bold text-neutral-900 mb-6 pb-6 border-b border-black/5">Profile Settings</h2>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Name</label>
                                <input
                                    type="text"
                                    disabled
                                    value={user?.name || 'Guest'}
                                    className="w-full bg-neutral-100/50 border border-black/5 rounded-xl px-4 h-11 text-neutral-500 cursor-not-allowed text-sm shadow-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    disabled
                                    value={user?.email || 'Not signed in'}
                                    className="w-full bg-neutral-100/50 border border-black/5 rounded-xl px-4 h-11 text-neutral-500 cursor-not-allowed text-sm shadow-none"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="spatial-card p-10 border border-red-500/10 bg-red-50/50">
                        <h2 className="text-lg font-bold text-red-600 mb-6 pb-6 border-b border-red-500/10">Danger Zone</h2>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-900">Sign Out</h3>
                                <p className="text-xs font-medium text-red-500/80 mt-1">Log out of your Calm Spatial Studio session.</p>
                            </div>
                            <button
                                onClick={logout}
                                className="h-10 px-5 bg-white text-red-600 hover:bg-red-50 shadow-sm border border-red-100 rounded-xl text-sm font-medium transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
