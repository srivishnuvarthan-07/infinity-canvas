const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' })); // Increased limit for large board data

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security headers
app.use(helmet());

// Prevent NoSQL injection
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 500 // Reasonable threshold that allows debounced saves but prevents flooding
});
app.use('/api', limiter);

// Uptime monitor route
app.get('/ping', (req, res) => {
    res.status(200).send("Server is alive 🚀");
});

// Mount routers
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/user/user.routes'));
app.use('/api/notifications', require('./modules/notification/notification.routes'));
app.use('/api/boards', require('./modules/board/board.routes'));
app.use('/api/library', require('./modules/library/library.routes'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/ai', require('./routes/ai'));

// Error Handler
app.use(require('./middleware/error'));

module.exports = app;
