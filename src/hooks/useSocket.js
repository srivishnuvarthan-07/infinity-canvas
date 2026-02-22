import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocket(boardId) {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState({});
    const [remoteCursors, setRemoteCursors] = useState({});
    const [remoteSelections, setRemoteSelections] = useState({});
    const [myIdentity, setMyIdentity] = useState(null);

    useEffect(() => {
        if (!boardId) return;

        // Initialize socket
        socketRef.current = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log("Socket Connected:", socket.id, "Joining board:", boardId);
            setIsConnected(true);
            socket.emit('join-board', { boardId, user });
        });

        socket.on('disconnect', () => {
            console.log("Socket Disconnected");
            setIsConnected(false);
        });

        socket.on('user-joined', (identity) => {
            if (identity && identity.displayName) {
                toast.success(`${identity.displayName} joined the board`);
            }
            setRemoteUsers(prev => ({
                ...prev,
                [identity.userId]: identity
            }));
        });

        socket.on('your-identity', (identity) => {
            setMyIdentity(identity);
        });

        socket.on('remote-cursor', (cursorData) => {
            setRemoteCursors(prev => ({
                ...prev,
                [cursorData.userId]: cursorData
            }));
        });

        socket.on('remote-selection', ({ userId, color, displayName, selectedIds }) => {
            setRemoteSelections(prev => {
                if (!selectedIds || selectedIds.length === 0) {
                    const updated = { ...prev };
                    delete updated[userId];
                    return updated;
                }
                return {
                    ...prev,
                    [userId]: { color, displayName, selectedIds }
                };
            });
        });

        socket.on('user-left', ({ userId }) => {
            setRemoteUsers(prev => {
                const updated = { ...prev };
                if (updated[userId]) {
                    toast.info(`${updated[userId].displayName} left the board`);
                    delete updated[userId];
                }
                return updated;
            });
            setRemoteCursors(prev => {
                const updated = { ...prev };
                delete updated[userId];
                return updated;
            });
            setRemoteSelections(prev => {
                const updated = { ...prev };
                delete updated[userId];
                return updated;
            });
        });

        return () => {
            if (socket.connected) {
                socket.emit('leave-board', { boardId, user });
                socket.disconnect();
            }
        };
    }, [boardId, user]);

    // Expose emit helper
    const emit = useCallback((event, data) => {
        if (socketRef.current?.connected) {
            // Auto inject boardId
            if (event === 'board-action' || event === 'cursor-move' || event === 'lock-shape' || event === 'unlock-shape' || event === 'selection-change') {
                if (data && typeof data === 'object') {
                    data.boardId = boardId;
                    if (event === 'board-action' && data.action) {
                        data.action.userId = user?._id || socketRef.current.id;
                    }
                }
            }
            socketRef.current.emit(event, data);
        }
    }, [boardId, user]);

    // Expose listener helper
    const on = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.off(event, callback);
            }
        };
    }, []);

    return useMemo(() => ({
        isConnected,
        emit,
        on,
        remoteUsers,
        remoteCursors,
        remoteSelections,
        myIdentity,
        socketId: socketRef.current?.id
    }), [isConnected, emit, on, remoteUsers, remoteCursors, remoteSelections, myIdentity]);
}
