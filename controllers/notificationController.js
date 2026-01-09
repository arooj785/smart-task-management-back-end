const Notification = require("../models/Notification");
const { notificationLogger, markNotificationsAsRead } = require("../utils/notificationHelper");

/**
 * Get all notifications for logged-in user
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { isRead, limit = 50, page = 1 } = req.query;

        notificationLogger.info('Fetching notifications', { userId, isRead, limit, page });

        // Build filter
        const filter = { recipient: userId };
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

// Pagination
const skip = (parseInt(page) - 1) * parseInt(limit);

// Fetch notifications
        const notifications = await Notification.find(filter)
            .populate('sender', 'name email profileImage')
            .populate('metadata.taskId', 'title status priority')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count
        const totalCount = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ 
            recipient: userId, 
            isRead: false 
        });

        notificationLogger.info('Notifications fetched successfully', { 
            userId, 
            count: notifications.length,
            totalCount,
            unreadCount
        });

        return res.json({
            success: true,
            notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            },
            unreadCount
        });

    } catch (err) {
        notificationLogger.error('Failed to fetch notifications', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        notificationLogger.debug('Unread count fetched', { userId, count });

        return res.json({
            success: true,
            unreadCount: count
        });

    } catch (err) {
        notificationLogger.error('Failed to fetch unread count', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        notificationLogger.info('Marking notification as read', { notificationId: id, userId });

        const notification = await Notification.findOne({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (!notification.isRead) {
            await notification.markAsRead();
            notificationLogger.info('Notification marked as read', { notificationId: id });
        }

        return res.json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (err) {
        notificationLogger.error('Failed to mark notification as read', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        notificationLogger.info('Marking all notifications as read', { userId });

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { 
                $set: { 
                    isRead: true,
                    readAt: new Date()
                } 
            }
        );

        notificationLogger.info('All notifications marked as read', { 
            userId, 
            modifiedCount: result.modifiedCount 
        });

        return res.json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });

    } catch (err) {
        notificationLogger.error('Failed to mark all notifications as read', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        notificationLogger.info('Deleting notification', { notificationId: id, userId });

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notificationLogger.info('Notification deleted successfully', { notificationId: id });

        return res.json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (err) {
        notificationLogger.error('Failed to delete notification', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Delete all read notifications
 */
exports.deleteAllRead = async (req, res) => {
    try {
        const userId = req.user._id;

        notificationLogger.info('Deleting all read notifications', { userId });

        const result = await Notification.deleteMany({
            recipient: userId,
            isRead: true
        });

        notificationLogger.info('Read notifications deleted', { 
            userId, 
            deletedCount: result.deletedCount 
        });

        return res.json({
            success: true,
            message: "All read notifications deleted",
            deletedCount: result.deletedCount
        });

    } catch (err) {
        notificationLogger.error('Failed to delete read notifications', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        notificationLogger.debug('Unread count fetched', { userId, count });

        return res.json({
            success: true,
            unreadCount: count
        });

    } catch (err) {
        notificationLogger.error('Failed to fetch unread count', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        notificationLogger.info('Marking notification as read', { notificationId: id, userId });

        const notification = await Notification.findOne({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (!notification.isRead) {
            await notification.markAsRead();
            notificationLogger.info('Notification marked as read', { notificationId: id });
        }

        return res.json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (err) {
        notificationLogger.error('Failed to mark notification as read', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        notificationLogger.info('Marking all notifications as read', { userId });

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { 
                $set: { 
                    isRead: true,
                    readAt: new Date()
                } 
            }
        );

        notificationLogger.info('All notifications marked as read', { 
            userId, 
            modifiedCount: result.modifiedCount 
        });

        return res.json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });

    } catch (err) {
        notificationLogger.error('Failed to mark all notifications as read', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        notificationLogger.info('Deleting notification', { notificationId: id, userId });

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notificationLogger.info('Notification deleted successfully', { notificationId: id });

        return res.json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (err) {
        notificationLogger.error('Failed to delete notification', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Delete all read notifications
 */
exports.deleteAllRead = async (req, res) => {
    try {
        const userId = req.user._id;

        notificationLogger.info('Deleting all read notifications', { userId });

        const result = await Notification.deleteMany({
            recipient: userId,
            isRead: true
        });

        notificationLogger.info('Read notifications deleted', { 
            userId, 
            deletedCount: result.deletedCount 
        });

        return res.json({
            success: true,
            message: "All read notifications deleted",
            deletedCount: result.deletedCount
        });

    } catch (err) {
        notificationLogger.error('Failed to delete read notifications', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get notification by ID
 */
exports.getNotificationById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        notificationLogger.debug('Fetching notification by ID', { notificationId: id, userId });

        const notification = await Notification.findOne({
            _id: id,
            recipient: userId
        })
        .populate('sender', 'name email profileImage')
        .populate('metadata.taskId', 'title status priority description');

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.json({
            success: true,
            notification
        });

    } catch (err) {
        notificationLogger.error('Failed to fetch notification by ID', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};