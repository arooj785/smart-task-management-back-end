const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Socket logger utility
 */
const socketLogger = {
    info: (message, data = {}) => {
        console.log(`[SOCKET-INFO] ${new Date().toISOString()} - ${message}`, 
            Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
    },
    error: (message, error = {}) => {
        console.error(`[SOCKET-ERROR] ${new Date().toISOString()} - ${message}`, 
            error.stack || error);
    },
    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[SOCKET-DEBUG] ${new Date().toISOString()} - ${message}`, 
                Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
        }
    }
};

/**
 * Store active user connections
 * Map of userId -> Set of socketIds
 */
const userConnections = new Map();

/**
 * Authenticate socket connection using JWT
 */
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            socketLogger.debug('Socket connection attempt without token', { socketId: socket.id });
            return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            socketLogger.error('Socket authentication failed - user not found', { userId: decoded.id });
            return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.user = user;
        socketLogger.info('Socket authenticated successfully', { 
            socketId: socket.id, 
            userId: user._id, 
            userName: user.name,
            userRole: user.role
        });
        
        next();
    } catch (error) {
        socketLogger.error('Socket authentication error', error);
        next(new Error('Authentication failed'));
    }
};

/**
 * Initialize Socket.IO with all event handlers
 */
const initializeSocket = (io) => {
    // Apply authentication middleware
    io.use(authenticateSocket);

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();
        const userName = socket.user.name;
        const userRole = socket.user.role;

        socketLogger.info('Client connected', { 
            socketId: socket.id, 
            userId, 
            userName,
            userRole 
        });

        // Join user to their personal room
        socket.join(`user:${userId}`);
        socketLogger.debug('User joined personal room', { userId, room: `user:${userId}` });

        // Join role-based room
        socket.join(`role:${userRole}`);
        socketLogger.debug('User joined role room', { userId, role: userRole, room: `role:${userRole}` });

        // Track user connection
        if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
        }
        userConnections.get(userId).add(socket.id);
        socketLogger.debug('User connection tracked', { 
            userId, 
            activeConnections: userConnections.get(userId).size 
        });

        // Notify user of successful connection
        socket.emit('connected', {
            message: 'Successfully connected to notification server',
            userId,
            userName,
            userRole,
            socketId: socket.id,
            timestamp: new Date()
        });

        // Handle ping/pong for connection health check
        socket.on('ping', () => {
            socketLogger.debug('Ping received', { socketId: socket.id, userId });
            socket.emit('pong', { timestamp: new Date() });
        });

        // Handle user status events
        socket.on('user:status', (data) => {
            socketLogger.debug('User status update', { userId, status: data.status });
            // Broadcast to admins
            io.to('role:admin').emit('user:status:update', {
                userId,
                userName,
                status: data.status,
                timestamp: new Date()
            });
        });

        // Handle typing indicators for tasks (if needed)
        socket.on('task:typing', (data) => {
            socketLogger.debug('Task typing indicator', { userId, taskId: data.taskId });
            socket.broadcast.emit('task:typing:update', {
                userId,
                userName,
                taskId: data.taskId,
                isTyping: data.isTyping
            });
        });

        // Handle disconnect
        socket.on("disconnect", (reason) => {
            socketLogger.info('Client disconnected', { 
                socketId: socket.id, 
                userId, 
                userName,
                reason 
            });

            // Remove from user connections
            if (userConnections.has(userId)) {
                userConnections.get(userId).delete(socket.id);
                if (userConnections.get(userId).size === 0) {
                    userConnections.delete(userId);
                    socketLogger.debug('User fully disconnected - all sessions closed', { userId });
                } else {
                    socketLogger.debug('User still has active connections', { 
                        userId, 
                        remainingConnections: userConnections.get(userId).size 
                    });
                }
            }
        });

        // Handle errors
        socket.on("error", (error) => {
            socketLogger.error('Socket error', { 
                socketId: socket.id, 
                userId, 
                error 
            });
        });
    });

    socketLogger.info('Socket.IO initialized successfully');
};

/**
 * Emit notification to specific user
 */
const emitToUser = (io, userId, event, data) => {
    try {
        const room = `user:${userId}`;
        io.to(room).emit(event, data);
        socketLogger.info('Event emitted to user', { 
            userId, 
            event, 
            room,
            hasActiveConnections: userConnections.has(userId.toString())
        });
        return true;
    } catch (error) {
        socketLogger.error('Failed to emit to user', error);
        return false;
    }
};

/**
 * Emit notification to specific role
 */
const emitToRole = (io, role, event, data) => {
    try {
        const room = `role:${role}`;
        io.to(room).emit(event, data);
        socketLogger.info('Event emitted to role', { role, event, room });
        return true;
    } catch (error) {
        socketLogger.error('Failed to emit to role', error);
        return false;
    }
};

/**
 * Emit notification to all admins
 */
const emitToAdmins = (io, event, data) => {
    return emitToRole(io, 'admin', event, data);
};

/**
 * Emit notification to all workers
 */
const emitToWorkers = (io, event, data) => {
    return emitToRole(io, 'worker', event, data);
};

/**
 * Check if user is currently connected
 */
const isUserOnline = (userId) => {
    return userConnections.has(userId.toString());
};

/**
 * Get count of online users
 */
const getOnlineUsersCount = () => {
    return userConnections.size;
};

/**
 * Get all online user IDs
 */
const getOnlineUserIds = () => {
    return Array.from(userConnections.keys());
};

module.exports = {
    initializeSocket,
    emitToUser,
    emitToRole,
    emitToAdmins,
    emitToWorkers,
    isUserOnline,
    getOnlineUsersCount,
    getOnlineUserIds,
    socketLogger
};
