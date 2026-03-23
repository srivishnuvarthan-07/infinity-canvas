import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBoardStore } from '@/hooks/useBoardStore';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import GuestDashboardView from '@/components/dashboard/views/GuestDashboardView';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const { isLoaded } = useBoardStore();
    const location = useLocation();

    // Redirection Logic
    if (user && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) {
        return <Navigate to="/dashboard/overview" replace />;
    }

    if (!isLoaded) {
        return (
            <div className="h-screen w-full flex items-center justify-center dashboard-bg">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    // Completely replace layout for guests
    if (!user) {
        return <GuestDashboardView />;
    }

    return (
        <div className="flex h-screen dashboard-bg text-neutral-800 font-sans selection:bg-neutral-200">
            {/* Left Sidebar */}
            <DashboardSidebar />

            {/* Main Content Area (Outlet for sub-views) */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                <Outlet />
            </div>
        </div>
    );
}
