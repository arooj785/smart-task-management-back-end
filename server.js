
const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
require("dotenv").config();
const path = require("path");
const cors = require("cors")
const connectdb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
//conect db
connectdb();
const app = express();
const server = http.createServer(app);
//Socket.io setup
const io= new Server(server, {
    cors:{
        origin:"*",
        methods:["GET","POST", "PUT", "DELETE"]
    },
})
app.set("io", io);
io.on("connection", (socket)=>{
    console.log("New client connected: ", socket.id);
    socket.on("disconnect", ()=>{
        console.log("Client disconnected: ", socket.id);
    });
});
//Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}));
//Static folder for attachments
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.get("/", (req, res)=>{
    res.send("Task Management System API");
});
//error handling middleware
app.use((err, req, res, next)=>{
    console.error(err.stack);
    res.status(500).json({message: "Server Error"});
})
//Start server
const port = process.env.PORT||3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

