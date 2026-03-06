const Action = require('./models/Action');
const Board = require('./models/Board');

const sessionData = new Map();
const userSockets = new Map(); // Global tracking: userId => Set of socket.ids

let ioInstance;

function setupSocket(io) {
    ioInstance = io;
    io.on('connection', (socket) => {

        // Global Tracking for Notifications
        socket.on('global-connect', ({ user }) => {
            if (user && user._id) {
                const userId = user._id.toString();
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId).add(socket.id);
            }
        });

        socket.on('join-board', async ({ boardId, user }) => {
            if (!boardId) return;

            // 1. Verify Access
            try {
                const board = await Board.findById(boardId);
                if (!board) {
                    return socket.emit('error', { message: 'Board not found' });
                }

                // If no user is passed in socket handshake, they are a guest
                const canView = await board.hasAccess(user, 'view');
                if (!canView) {
                    return socket.emit('error', { message: 'Not authorized to join this board' });
                }

                const canEdit = await board.hasAccess(user, 'edit');

                let identity;
                if (user && user._id) {
                    identity = {
                        userId: user._id,
                        displayName: user.name,
                        color: '#4F46E5', // Indigo from UI
                        isGuest: false
                    };
                } else {
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    const randomHue = Math.floor(Math.random() * 360);
                    identity = {
                        userId: socket.id,
                        displayName: `Guest-${randomSuffix}`,
                        color: `hsl(${randomHue}, 70%, 50%)`,
                        isGuest: true
                    };
                }

                sessionData.set(socket.id, { boardId, identity, canEdit });
                socket.join(boardId);

                // Broadcast to others
                socket.to(boardId).emit('user-joined', identity);
                // Tell the connecting client their assigned identity
                socket.emit('your-identity', identity);
            } catch (err) {
                console.error("Error joining board room:", err);
                socket.emit('error', { message: 'Server error verifying access' });
            }
        });

        socket.on('leave-board', ({ boardId }) => {
            if (!boardId) return;
            const session = sessionData.get(socket.id);
            if (session) {
                socket.to(boardId).emit('user-left', { userId: session.identity.userId });
                sessionData.delete(socket.id);
            }
            socket.leave(boardId);
        });

        socket.on('board-action', async (data) => {
            // data ideally has { boardId, action }
            const { boardId, action } = data;

            if (!boardId || !action) return;

            // Verify the sender is allowed to edit
            const session = sessionData.get(socket.id);
            if (!session || !session.canEdit || session.boardId !== boardId) {
                return; // Silently drop unauthorized emit
            }

            // Broadcast to all other participants in the board
            socket.to(boardId).emit('remote-action', action);
        });

        // Ephemeral events (not stored in DB)

        socket.on('cursor-move', ({ boardId, cursor }) => {
            const session = sessionData.get(socket.id);
            if (!session) return;
            // cursor = { x, y }
            socket.to(boardId).emit('remote-cursor', {
                ...session.identity,
                x: cursor.x,
                y: cursor.y
            });
        });

        socket.on('selection-change', ({ boardId, selectedIds }) => {
            const session = sessionData.get(socket.id);
            if (!session) return;
            socket.to(boardId).emit('remote-selection', {
                userId: session.identity.userId,
                color: session.identity.color,
                displayName: session.identity.displayName,
                selectedIds
            });
        });

        socket.on('lock-shape', ({ boardId, shapeId, userId }) => {
            socket.to(boardId).emit('shape-locked', { shapeId, userId });
        });

        socket.on('unlock-shape', ({ boardId, shapeId, userId }) => {
            socket.to(boardId).emit('shape-unlocked', { shapeId, userId });
        });

        socket.on('disconnect', () => {
            const session = sessionData.get(socket.id);
            if (session) {
                socket.to(session.boardId).emit('user-left', { userId: session.identity.userId });
                sessionData.delete(socket.id);
            }

            // Global removal
            for (const [userId, sockets] of userSockets.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSockets.delete(userId);
                    }
                    break;
                }
            }
        });
    });
}

function emitNotification(userId, notification) {
    if (!ioInstance) return;
    const uidStr = userId.toString();
    const sockets = userSockets.get(uidStr);
    if (sockets && sockets.size > 0) {
        for (const socketId of sockets) {
            ioInstance.to(socketId).emit('new-notification', notification);
        }
    }
}

function emitToBoard(boardId, event, data) {
    if (!ioInstance) return;
    ioInstance.to(boardId.toString()).emit(event, data);
}

module.exports = { setupSocket, emitNotification, emitToBoard };
