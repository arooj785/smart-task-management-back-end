const Router = require("express").Router();
const workerCtrl = require("../controllers/workerController");
const {protect} = require("../middleware/authMiddleware");

//worker profile
Router.get("/profile",protect, workerCtrl.getProfile);
Router.put("/profile",protect, workerCtrl.updateProfile);
//worker Task
Router.get("/my-tasks",protect, workerCtrl.getMyTasks);
Router.put("/task/:id/status",protect, workerCtrl.statusUpdate);

module.exports = Router;