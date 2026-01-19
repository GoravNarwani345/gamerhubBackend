const Report = require('../models/report');
const User = require('../models/user');

// User creates a report
const createReport = async (req, res) => {
    const { targetId, reportType, contentId, reason, description } = req.body;

    const report = new Report({
        reporterId: req.user.userId,
        targetId,
        reportType,
        contentId,
        reason,
        description
    });

    await report.save();
    res.status(201).json({ success: true, message: 'Report submitted successfully', report });
};

// Admin lists all reports
const getReports = async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const reports = await Report.find(filter)
        .populate('reporterId', 'username email')
        .populate('targetId', 'username email isBanned')
        .sort({ createdAt: -1 });

    res.json({ success: true, reports });
};

// Admin updates report status
const updateReportStatus = async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findByIdAndUpdate(
        id,
        { status, adminNotes },
        { new: true }
    );

    if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'Report updated', report });
};

// Admin bans a user
const banUser = async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
        userId,
        { isBanned: true, banReason: reason },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User has been banned', user });
};

// Admin unbans a user
const unbanUser = async (req, res) => {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
        userId,
        { isBanned: false, banReason: '' },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User has been unbanned', user });
};

module.exports = {
    createReport,
    getReports,
    updateReportStatus,
    banUser,
    unbanUser
};
