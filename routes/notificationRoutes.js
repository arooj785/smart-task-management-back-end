const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    getNotificationById
} = require("../controllers/notificationController");

// All routes require authentication
router.use(protect);

// Get all notifications for the logged-in user
// Query params: isRead (boolean), limit (number), page (number)
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Get specific notification by ID
router.get("/:id", getNotificationById);

// Mark specific notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Delete specific notification
router.delete("/:id", deleteNotification);

// Delete all read notifications
router.delete("/read/clear", deleteAllRead);

module.exports = router;