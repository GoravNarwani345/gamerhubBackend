const User = require('../models/user');

const adminAuth = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const user = await User.findById(req.user.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }

        // Attach full user object to request for further use
        req.admin = user;
        next();
    } catch (error) {
        console.error('Admin Auth Error:', error);
        res.status(500).json({ success: false, message: 'Server authentication error' });
    }
};

module.exports = adminAuth;
