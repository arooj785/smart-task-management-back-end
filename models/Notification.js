const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true // For faster queries
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: [
            "task_assigned",
            "task_updated", 
            "task_status_changed",
            "task_completed",
            "worker_created",
            "worker_updated",
            "worker_deleted",
            "general"
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        oldStatus: String,
        newStatus: String,
        priority: String,
        additionalData: mongoose.Schema.Types.Mixed
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    }
}, { timestamps: true });

// Compound index for efficient queries
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Method to mark notification as read
NotificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
};

module.exports = mongoose.model("Notification", NotificationSchema);