const Action = require('./models/Action');

const sessionData = new Map();

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`User connected to socket: ${socket.id}`);

        socket.on('join-board', ({ boardId, user }) => {
            if (!boardId) return;

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

            sessionData.set(socket.id, { boardId, identity });
            socket.join(boardId);

            console.log(`User ${identity.displayName} joined board ${boardId}`);

            // Broadcast to others
            socket.to(boardId).emit('user-joined', identity);
            // Tell the connecting client their assigned identity
            socket.emit('your-identity', identity);
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

            // Broadcast to all other participants in the board
            socket.to(boardId).emit('remote-action', action);

            // Remove Database Writes from Realtime Socket Layer to prevent flooding and keep it lightweight.
            // Action tracking is disabled in Minimal Collaboration Mode.
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
            console.log(`Socket disconnected: ${socket.id}`);
            const session = sessionData.get(socket.id);
            if (session) {
                socket.to(session.boardId).emit('user-left', { userId: session.identity.userId });
                sessionData.delete(socket.id);
            }
        });
    });
}

module.exports = setupSocket;
