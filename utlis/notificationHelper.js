const Notification = require("../models/Notification");
const { emitToUser, socketLogger: socketLog } = require("../socket");

/**
 * Logger utility for notifications
 */
const notificationLogger = {
    info: (message, data = {}) => {
        console.log(`[NOTIFICATION-INFO] ${new Date().toISOString()} - ${message}`, 
            Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
    },
    error: (message, error = {}) => {
        console.error(`[NOTIFICATION-ERROR] ${new Date().toISOString()} - ${message}`, 
            error.stack || error);
    },
    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[NOTIFICATION-DEBUG] ${new Date().toISOString()} - ${message}`, 
                Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
        }
    }
};

/**
 * Create and emit notification
 * @param {Object} io - Socket.io instance
 * @param {Object} notificationData - Notification details
 * @returns {Promise<Object>} Created notification
 */
const createAndEmitNotification = async (io, notificationData) => {
    try {
        notificationLogger.debug('Creating notification', { notificationData });

        const { recipient, sender, type, title, message, metadata } = notificationData;

        // Validate required fields
        if (!recipient) {
            throw new Error('Recipient is required for notification');
        }
        if (!type) {
            throw new Error('Notification type is required');
        }
        if (!title || !message) {
            throw new Error('Title and message are required');
        }

        // Create notification in database
        const notification = new Notification({
            recipient,
            sender,
            type,
            title,
            message,
            metadata: metadata || {},
            isRead: false
        });

        await notification.save();
        
        notificationLogger.info('Notification created successfully', {
            notificationId: notification._id,
            recipient,
            type,
            title
        });

        // Emit socket event if io instance is available
        if (io) {
            const socketData = {
                notificationId: notification._id,
                recipient,
                type,
                title,
                message,
                metadata,
                timestamp: notification.createdAt
            };

            // Emit to specific user using their personal room
            emitToUser(io, recipient, 'notification', socketData);
            
            notificationLogger.info('Socket event emitted to specific user', {
                event: 'notification',
                recipient,
                notificationId: notification._id
            });
        } else {
            notificationLogger.debug('No socket.io instance provided, skipping emit');
        }

        return notification;

    } catch (error) {
        notificationLogger.error('Failed to create/emit notification', error);
        throw error;
    }
};

/**
 * Create notification for task assignment
 */
const notifyTaskAssigned = async (io, { taskId, title, assignedTo, assignedBy }) => {
    try {
        notificationLogger.info('Creating task assignment notification', { taskId, assignedTo });

        return await createAndEmitNotification(io, {
            recipient: assignedTo,
            sender: assignedBy,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${title}"`,
            metadata: {
                taskId,
                additionalData: { taskTitle: title }
            }
        });
    } catch (error) {
        notificationLogger.error('Failed to create task assignment notification', error);
        throw error;
    }
};

/**
 * Create notification for task status update
 */
const notifyTaskUpdated = async (io, { taskId, title, status, updatedBy, assignedTo, oldStatus }) => {
    try {
        notificationLogger.info('Creating task update notification', { taskId, status });

        // Determine recipient based on who updated
        // If worker updated, notify admin; if admin updated, notify worker
        let recipient = assignedTo;
        let message = `Task "${title}" status changed from ${oldStatus} to ${status}`;
        
        return await createAndEmitNotification(io, {
            recipient,
            sender: updatedBy,
            type: 'task_status_changed',
            title: 'Task Status Updated',
            message,
            metadata: {
                taskId,
                oldStatus,
                newStatus: status,
                additionalData: { taskTitle: title }
            }
        });
    } catch (error) {
        notificationLogger.error('Failed to create task update notification', error);
        throw error;
    }
};

/**
 * Create notification for task completion
 */
const notifyTaskCompleted = async (io, { taskId, title, completedBy, assignedTo, createdBy }) => {
    try {
        notificationLogger.info('Creating task completion notification', { taskId });

        // Notify admin/creator about task completion
        const recipient = createdBy || assignedTo;
        
        return await createAndEmitNotification(io, {
            recipient,
            sender: completedBy,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${title}" has been marked as completed`,
            metadata: {
                taskId,
                newStatus: 'completed',
                additionalData: { taskTitle: title }
            }
        });
    } catch (error) {
        notificationLogger.error('Failed to create task completion notification', error);
        throw error;
    }
};

/**
 * Bulk mark notifications as read
 */
const markNotificationsAsRead = async (notificationIds, userId) => {
    try {
        notificationLogger.info('Marking notifications as read', { count: notificationIds.length, userId });

        const result = await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                recipient: userId,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        notificationLogger.info('Notifications marked as read', {
            modifiedCount: result.modifiedCount
        });

        return result;
    } catch (error) {
        notificationLogger.error('Failed to mark notifications as read', error);
        throw error;
    }
};

module.exports = {
    createAndEmitNotification,
    notifyTaskAssigned,
    notifyTaskUpdated,
    notifyTaskCompleted,
    markNotificationsAsRead,
    notificationLogger
};
