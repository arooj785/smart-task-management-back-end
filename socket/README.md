# Socket.IO Implementation Guide

## Overview
This directory contains the Socket.IO implementation for real-time notifications in the Task Management System.

## Features

### 🔐 Authentication
- JWT-based socket authentication
- Users must provide a valid token to connect
- Automatic user information attachment to socket connections

### 🏠 Room Management
- *Personal Rooms*: Each user joins user:{userId} room for targeted notifications
- *Role Rooms*: Users join role:admin or role:worker for role-based broadcasts
- Connection tracking for online status

### 📡 Event Handlers

#### Client → Server Events
- ping - Health check (responds with pong)
- user:status - User status updates
- task:typing - Real-time typing indicators

#### Server → Client Events
- connected - Confirmation of successful connection
- notification - New notification received
- taskAssigned - Task assignment events
- taskUpdated - Task update events
- user:status:update - User status broadcasts
- task:typing:update - Typing indicator broadcasts
- pong - Response to ping

### 📊 Logging
All socket events are logged with:
- [SOCKET-INFO] - Connections, disconnections, event emissions
- [SOCKET-ERROR] - Authentication failures, errors
- [SOCKET-DEBUG] - Detailed debugging info (dev mode only)

## Usage

### Server-Side

#### Initialize Socket (in server.js)
javascript
const { initializeSocket } = require("./socket");
const io = new Server(server, { cors: { origin: "*" } });
initializeSocket(io);


#### Emit to Specific User
javascript
const { emitToUser } = require("./socket");
emitToUser(io, userId, 'notification', { message: 'Hello!' });


#### Emit to Role
javascript
const { emitToAdmins, emitToWorkers } = require("./socket");
emitToAdmins(io, 'announcement', { message: 'System maintenance' });


#### Check User Status
javascript
const { isUserOnline, getOnlineUsersCount } = require("./socket");
if (isUserOnline(userId)) {
    console.log('User is online');
}
console.log(`Total online: ${getOnlineUsersCount()}`);


### Client-Side

#### Connect with Authentication
javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
    auth: {
        token: "your-jwt-token-here"
    },
    transports: ["polling", "websocket"]
});


#### Listen for Events
javascript
// Connection success
socket.on("connected", (data) => {
    console.log("Connected:", data);
});

// Receive notifications
socket.on("notification", (notification) => {
    console.log("New notification:", notification);
    // Show toast, update UI, etc.
});

// Task assignments
socket.on("taskAssigned", (data) => {
    console.log("Task assigned:", data);
});

// Task updates
socket.on("taskUpdated", (data) => {
    console.log("Task updated:", data);
});


#### Send Events
javascript
// Health check
socket.emit("ping");
socket.on("pong", (data) => {
    console.log("Pong received:", data.timestamp);
});

// Update status
socket.emit("user:status", { status: "busy" });

// Typing indicator
socket.emit("task:typing", { 
    taskId: "123", 
    isTyping: true 
});


#### Handle Connection Issues
javascript
socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message);
    // Handle token refresh, retry, etc.
});

socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
    if (reason === "io server disconnect") {
        // Server disconnected, reconnect manually
        socket.connect();
    }
});


## API Reference

### Exported Functions

#### initializeSocket(io)
Initialize Socket.IO with authentication and event handlers.
- *Parameters*: io - Socket.IO server instance
- *Returns*: void

#### emitToUser(io, userId, event, data)
Emit event to specific user.
- *Parameters*: 
  - io - Socket.IO instance
  - userId - Target user ID
  - event - Event name
  - data - Event payload
- *Returns*: boolean (success)

#### emitToRole(io, role, event, data)
Emit event to all users with specific role.
- *Parameters*: 
  - io - Socket.IO instance
  - role - Role name ('admin' or 'worker')
  - event - Event name
  - data - Event payload
- *Returns*: boolean (success)

#### emitToAdmins(io, event, data)
Shorthand to emit to all admins.

#### emitToWorkers(io, event, data)
Shorthand to emit to all workers.

#### isUserOnline(userId)
Check if user has active socket connection.
- *Returns*: boolean

#### getOnlineUsersCount()
Get count of currently connected users.
- *Returns*: number

#### getOnlineUserIds()
Get array of all online user IDs.
- *Returns*: string[]

## Testing

Use the [test.js](test.js) file to test socket connections:

bash
node socket/test.js


## Security Notes

1. *JWT Required*: All connections must provide valid JWT token
2. *Token Validation*: Token is verified against JWT_SECRET
3. *User Verification*: User existence is checked in database
4. *Personal Rooms*: Users can only receive targeted notifications

## Troubleshooting

### Connection Fails
- Verify JWT token is valid and not expired
- Check JWT_SECRET matches between client and server
- Ensure CORS settings allow your client origin

### Not Receiving Notifications
- Verify user is authenticated and in correct room
- Check socket connection status on client
- Review server logs for emission confirmations

### Multiple Connections
- Same user can have multiple connections (multiple tabs/devices)
- Each connection gets unique socketId but shares userId room
- All user's connections receive notifications