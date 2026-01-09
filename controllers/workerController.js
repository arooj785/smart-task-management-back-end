const User = require("../models/User");
const Task = require("../models/Task");
const { notifyTaskUpdated, notifyTaskCompleted, notificationLogger } = require("../utils/notificationHelper");

exports.getProfile = async(req,res)=>{
    try{
        const{password,...workerData} = req.user.toObject();
  res.json({ success:true,worker:workerData});
    }catch(err){
   res.status(500).json({message:"Server error"})
    }
}
//update profile
exports.updateProfile = async(req,res)=>{
    try{
        const {name} = req.body;
        if(!name){
            return res.status(400).json({message:"name is required"})
            }
   const updatedProfile =  await User.findByIdAndUpdate(
   req.user._id,
    {name},
    {new:true}
   ).select("-password"); 
    res.json({
      message: "Profile updated successfully",
      worker: updatedProfile
    });
    }catch(err){
      res.status(500).json({message:"Server error"})

    }
}

//get worker task
exports.getMyTasks = async (req, res) => {
    try{
  const tasks = await Task.find({ assignedTo: req.user._id }).sort({
    createdAt: -1,
  });

  res.json({success:true, tasks});
}catch(err){
  res.status(500).json({message:"Server error"})
}
};

//status update
/*
exports.statusUpdate = async (req,res)=>{
    try{
 const {status} = req.body;
 const update = await Task.findOneAndUpdate(
    {_id:req.params.id , assignedTo: req.user._id},
    {status},
    {new:true}
 )
 if(!update){
    returnres.status(404).json({message:"Task not found or not assigned to you"});
 }
 res.json({message:"Status updated successfully", task:update});
    }catch(err){
    res.status(500).json({message:"Server error"})

    }
}
    */
   exports.statusUpdate = async (req, res) => {
  try {
    const workerId = req.user._id;
    const taskId = req.params.id;
    const { status } = req.body;

    // 1️⃣ Check if status is provided
    if (!status) {
      return res.status(400).json({ message: "Status is required in body" });
    }

    // 2️⃣ Find task first to get old status
    const task = await Task.findOne({ _id: taskId, assignedTo: workerId }).populate('createdBy');
    
    if (!task) {
      notificationLogger.info('Task not found or not assigned to worker', { taskId, workerId });
      return res.status(404).json({
        message: "Task not found or not assigned to this worker",
        taskId,
        workerId,
      });
    }

    const oldStatus = task.status;
    notificationLogger.info('Worker updating task status', { 
      taskId, 
      workerId, 
      oldStatus, 
      newStatus: status 
    });

    // 3️⃣ Update the task
    task.status = status;
    await task.save();

    // 4️⃣ Emit socket event and create notification
    if (req.app && req.app.get("io")) {
      const io = req.app.get("io");
      
      // Emit socket event
      io.emit("taskUpdated", {
        taskId: task._id,
        status: task.status,
        updatedBy: workerId
      });
      
      notificationLogger.info('Socket event emitted for worker task update', { taskId });
      
      // Create notification
      try {
        if (status === 'completed' && task.createdBy) {
          // Notify admin about task completion
          await notifyTaskCompleted(io, {
            taskId: task._id,
            title: task.title,
            completedBy: workerId,
            createdBy: task.createdBy._id || task.createdBy,
            assignedTo: workerId
          });
          notificationLogger.info('Task completion notification sent to admin', { 
            taskId, 
            createdBy: task.createdBy._id || task.createdBy 
          });
        } else if (task.createdBy) {
          // Notify admin about status change
          await notifyTaskUpdated(io, {
            taskId: task._id,
            title: task.title,
            status: status,
            oldStatus: oldStatus,
            updatedBy: workerId,
            assignedTo: task.createdBy._id || task.createdBy // Notify the creator/admin
          });
          notificationLogger.info('Task status update notification sent to admin', { 
            taskId, 
            createdBy: task.createdBy._id || task.createdBy 
          });
        }
      } catch (notifErr) {
        notificationLogger.error('Failed to create notification for worker task update', notifErr);
      }
    }

    // 5️⃣ Success
    notificationLogger.info('Task status updated successfully by worker', { taskId, newStatus: status });
    return res.json({
      message: "Task status updated successfully",
      task,
    });
  } catch (err) {
    notificationLogger.error('Worker status update failed', err);
    console.error("Status Update Error:", err); // Log exact error
    return res.status(500).json({
      message: "Server error while updating status",
      error: err.message,
    });
  }
};