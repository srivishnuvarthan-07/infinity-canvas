const User = require('../../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        let { name, email, password } = req.body;
        if (email) email = email.toLowerCase();


        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        if (email) email = email.toLowerCase();

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Sync Firebase user with MongoDB
// @route   POST /api/auth/firebase-sync
// @access  Public
exports.firebaseSync = async (req, res, next) => {
    try {
        let { name, email, uid, photoURL } = req.body;
        if (email) email = email.toLowerCase();

        if (!email || !uid) {
            return res.status(400).json({ success: false, error: 'Please provide email and uid' });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // Optional: update last login or photoURL here if needed
            user.lastLogin = Date.now();
            await user.save();
        } else {
            // Generate a secure random password since Firebase handles actual auth
            const randomPassword = uid + Math.random().toString(36).slice(-8) + Date.now().toString();

            // Create new user
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                password: randomPassword,
                provider: 'firebase'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
        path: "/"
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc    Log user out from all devices
// @route   POST /api/auth/logout-all
// @access  Private
exports.logoutAll = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.tokenVersion += 1;
        await user.save();
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            path: "/"
        });

        res.status(200).json({
            success: true,
            message: 'Logged out of all devices successfully'
        });
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const isProduction = process.env.NODE_ENV === "production";
    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = isProduction;
        options.sameSite = isProduction ? "None" : "Lax";
        options.path = "/";
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarColor: user.avatarColor,
                defaultStorage: user.defaultStorage
            }
        });
};
