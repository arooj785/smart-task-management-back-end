
{/*
import { io } from "socket.io-client";

// Configuration - Update these values
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWNkMGJkYjM3YzcwOTM1OTFlODIxYyIsImlhdCI6MTc2NTU2NTc3NSwiZXhwIjoxNzY2MTcwNTc1fQ.v64FxOFUANyZB4Nf2-mxyd3JxKKEP9qM3cyn_FAcgMk"; // Get this from login endpoint

// Create socket connection
const socket = io(SERVER_URL, {
  auth: {
    token: TOKEN,
  },
  transports: ["polling", "websocket"], // Try polling first, then websocket
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: false,
  // For HTTPS/WSS connections
  secure: SERVER_URL.startsWith("https"),
  // Path must match server configuration
  path: "/socket.io/",
});

// Connection event handlers
socket.on("connect", () => {
  console.log("✅ Connected to server");
  console.log("Socket ID:", socket.id);
  
  // Test ping/pong
  socket.emit("ping");
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
  console.error("Error details:", error);
  console.log("\n💡 Troubleshooting tips:");
  console.log("1. Check if server is running and accessible");
  console.log("2. Verify JWT token is valid and not expired");
  console.log("3. Check firewall/proxy settings");
  console.log("4. Ensure WebSocket upgrades are allowed");
  console.log("5. Try using polling transport only: transports: ['polling']\n");
});

// Notification event handler
socket.on("notification", (data) => {
  console.log("\n📨 New Notification Received:");
  console.log("Title:", data.title);
  console.log("Message:", data.message);
  console.log("Type:", data.type);
  console.log("Metadata:", JSON.stringify(data.metadata, null, 2));
  console.log("Timestamp:", data.timestamp);
  console.log("---\n");
});

// Pong response handler
socket.on("pong", () => {
  console.log("🏓 Pong received - connection is healthy");
});

// Additional event handlers for debugging
socket.on("reconnect", (attemptNumber) => {
  console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`🔄 Reconnection attempt #${attemptNumber}`);
});

socket.on("reconnect_error", (error) => {
  console.error("❌ Reconnection error:", error.message);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Failed to reconnect after all attempts");
});

// Keep the process alive
console.log("🔌 Socket test client started");
console.log(`📡 Connecting to: ${SERVER_URL}`);
console.log(`🔐 Using token: ${TOKEN.substring(0, 20)}...`);
console.log("Press Ctrl+C to exit\n");

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Closing socket connection...");
  socket.disconnect();
  process.exit(0);
});
*/}
import { io } from "socket.io-client";

// --------- CONFIGURATION ---------
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWNkMGJkYjM3YzcwOTM1OTFlODIxYyIsImlhdCI6MTc2NTU2NTc3NSwiZXhwIjoxNzY2MTcwNTc1fQ.v64FxOFUANyZB4Nf2-mxyd3JxKKEP9qM3cyn_FAcgMk";

// --------- CREATE SOCKET CONNECTION ---------
const socket = io(SERVER_URL, {
  auth: { token: TOKEN },
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  path: "/socket.io/",
});

// --------- CONNECTION EVENTS ---------
socket.on("connect", () => {
  console.log("✅ Connected to server");
  console.log("Socket ID:", socket.id);
  socket.emit("ping"); // test ping
});

socket.on("disconnect", () => console.log("❌ Disconnected from server"));

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
  console.log("💡 Check if server is running and token is valid.");
});

// --------- TASK EVENTS ---------
socket.on("taskAssigned", (data) => {
  console.log("\n📌 Task Assigned:");
  console.log("Task ID:", data.taskId);
  console.log("Title:", data.title);
  console.log("Assigned To:", data.assignedTo);
  console.log("---\n");
});

socket.on("taskUpdated", (data) => {
  console.log("\n📝 Task Status Updated:");
  console.log("Task ID:", data.taskId);
  console.log("New Status:", data.status);
  console.log("---\n");
});

// --------- OPTIONAL: PING/PONG ---------
socket.on("pong", () => console.log("🏓 Pong received - connection is healthy"));

// --------- RECONNECTION EVENTS ---------
socket.on("reconnect", (attemptNumber) => console.log(`🔄 Reconnected after ${attemptNumber} attempts`));
socket.on("reconnect_attempt", (attemptNumber) => console.log(`🔄 Reconnection attempt #${attemptNumber}`));
socket.on("reconnect_error", (error) => console.error("❌ Reconnection error:", error.message));
socket.on("reconnect_failed", () => console.error("❌ Failed to reconnect after all attempts"));

// --------- KEEP PROCESS ALIVE ---------
console.log("🔌 Socket test client started");
console.log(`📡 Connecting to: ${SERVER_URL}`);
console.log(`🔐 Using token: ${TOKEN.substring(0, 20)}...`);
console.log("Press Ctrl+C to exit\n");

process.on("SIGINT", () => {
  console.log("\n👋 Closing socket connection...");
  socket.disconnect();
  process.exit(0);
});
