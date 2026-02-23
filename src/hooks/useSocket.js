import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocket() {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const activeBoardIdRef = useRef(null);
    const [remoteUsers, setRemoteUsers] = useState({});
    const [remoteCursors, setRemoteCursors] = useState({});
    const [remoteSelections, setRemoteSelections] = useState({});
    const [myIdentity, setMyIdentity] = useState(null);

    // Clean up purely on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current?.connected) {
                const bId = activeBoardIdRef.current;
                if (bId) socketRef.current.emit('leave-board', { boardId: bId, user });
                socketRef.current.disconnect();
            }
        };
    }, []);

    const connect = useCallback((boardId) => {
        if (!boardId) return;
        if (socketRef.current?.connected) {
            // Already connected? If diff board, disconnect first.
            if (activeBoardIdRef.current === boardId) return;
            socketRef.current.disconnect();
        }

        activeBoardIdRef.current = boardId;

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
            setRemoteUsers({});
            setRemoteCursors({});
            setRemoteSelections({});
            setMyIdentity(null);
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

    }, [user]);

    const disconnect = useCallback(() => {
        if (socketRef.current?.connected) {
            const bId = activeBoardIdRef.current;
            if (bId) socketRef.current.emit('leave-board', { boardId: bId, user });
            socketRef.current.disconnect();
            activeBoardIdRef.current = null;
        }
    }, [user]);

    // Expose emit helper
    const emit = useCallback((event, data) => {
        if (socketRef.current?.connected) {
            const bId = activeBoardIdRef.current;
            // Auto inject boardId
            if (event === 'board-action' || event === 'cursor-move' || event === 'lock-shape' || event === 'unlock-shape' || event === 'selection-change') {
                if (data && typeof data === 'object') {
                    data.boardId = bId;
                    if (event === 'board-action' && data.action) {
                        data.action.userId = user?._id || socketRef.current.id;
                    }
                }
            }
            socketRef.current.emit(event, data);
        }
    }, [user]);

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
        connect,
        disconnect,
        isConnected,
        emit,
        on,
        remoteUsers,
        remoteCursors,
        remoteSelections,
        myIdentity,
        socketId: socketRef.current?.id
    }), [connect, disconnect, isConnected, emit, on, remoteUsers, remoteCursors, remoteSelections, myIdentity]);
}
