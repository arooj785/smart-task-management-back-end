const User = require("../models/User");
const Task = require("../models/Task");

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

    // 2️⃣ Find and update the task
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, assignedTo: workerId },
      { status },
      { new: true }
    );

    // 3️⃣ If no task found
    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found or not assigned to this worker",
        taskId,
        workerId,
      });
    }

    // 4️⃣ Success
    return res.json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (err) {
    console.error("Status Update Error:", err); // Log exact error
    return res.status(500).json({
      message: "Server error while updating status",
      error: err.message,
    });
  }
};

