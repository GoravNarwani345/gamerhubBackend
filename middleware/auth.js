const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user to check status
        const user = await User.findById(decoded.userId).select('isBanned banReason');
        if (user && user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned.',
                reason: user.banReason
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = auth;
