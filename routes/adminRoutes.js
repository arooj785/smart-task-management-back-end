const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const {protect, adminOnly} = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

//Worker  routes
router.post("/worker", protect, adminOnly, adminCtrl.createWorker);
router.get("/workers", protect, adminOnly, adminCtrl.getWorkers);
router.delete("/worker/:id", protect, adminOnly, adminCtrl.deleteWorker);
router.get("/worker/:id", protect, adminOnly, adminCtrl.getWorkerById);
router.put("/worker/:id", protect, adminOnly, upload.single("profileImage"), adminCtrl.updateWorker);

//Task routes
//allow attachments  (multer) use upload.array ("attachments")
router.post("/task", protect, adminOnly, upload.array("attachments"), adminCtrl.createTask);
router.get("/tasks", protect, adminOnly, adminCtrl.getTasks);
router.get("/task/:id", protect, adminOnly, adminCtrl.getTaskById);
router.put("/task/assign", protect, adminOnly, adminCtrl.assignTask);
router.put("/task/:id/status", protect, adminOnly, adminCtrl.updateTaskStatus);
//admin routes
router.get("/profile", protect, adminOnly, adminCtrl.getAdminProfile);
router.put("/profile", protect, adminOnly, upload.single("profileImage"), adminCtrl.updateAdminProfile);
//Dashboard
router.get("/dashboard", protect, adminOnly, adminCtrl.getDashboard);

module.exports = router;