import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { io } from 'socket.io-client';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    // Initial Fetch
    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                const data = res.data.data || [];
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };
        fetchNotifications();
    }, [user]);

    // Global Socket for realtime notifications
    useEffect(() => {
        if (!user) return;

        socketRef.current = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
            socketRef.current.emit('global-connect', { user });
        });

        socketRef.current.on('new-notification', (notif) => {
            toast.info(notif.message, {
                icon: <Bell className="h-4 w-4" />
            });
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user]);

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await api.put('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const handleMarkAsRead = async (id, currentRead) => {
        if (currentRead) return;
        try {
            await api.put(`/notifications/${id}/read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <DropdownMenu onOpenChange={(open) => { if (open && unreadCount > 0) { /* Optional: auto mark read */ } }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 rounded-full h-10 w-10">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-hidden flex flex-col p-0 border-neutral-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                    <DropdownMenuLabel className="font-semibold px-0">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-0 text-xs text-indigo-600 hover:bg-transparent hover:underline font-medium">
                            Mark all as read
                        </Button>
                    )}
                </div>
                <div className="overflow-y-auto overflow-x-hidden flex-1 p-2">
                    {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-neutral-500">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem
                                key={notif._id}
                                className={`flex flex-col items-start gap-1 p-3 mb-1 cursor-pointer rounded-lg transition-colors ${!notif.read ? 'bg-indigo-50/50' : ''}`}
                                onClick={() => handleMarkAsRead(notif._id, notif.read)}
                            >
                                <div className="flex justify-between w-full items-start gap-2">
                                    <span className={`text-sm ${!notif.read ? 'font-medium text-neutral-900' : 'text-neutral-700'}`}>
                                        {notif.message}
                                    </span>
                                    {!notif.read && <span className="h-2 w-2 mt-1.5 shrink-0 rounded-full bg-indigo-500"></span>}
                                </div>
                                <span className="text-[11px] text-neutral-400">
                                    {formatTime(notif.createdAt)}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
