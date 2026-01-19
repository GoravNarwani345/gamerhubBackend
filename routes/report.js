const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
    createReport,
    getReports,
    updateReportStatus,
    banUser,
    unbanUser
} = require('../controllers/report');

// User routes
router.post('/', auth, createReport);

// Admin routes
router.get('/admin/all', auth, adminAuth, getReports);
router.patch('/admin/:id', auth, adminAuth, updateReportStatus);
router.post('/admin/ban/:userId', auth, adminAuth, banUser);
router.post('/admin/unban/:userId', auth, adminAuth, unbanUser);

module.exports = router;
