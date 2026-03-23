require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const http = require('http');
const socketIo = require('socket.io');
const { setupSocket } = require('./src/socket.handler');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ["GET", "POST"],
        credentials: true
    }
});

setupSocket(io);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});
