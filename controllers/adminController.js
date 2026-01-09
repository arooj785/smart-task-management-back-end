const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");
const path = require("path");
const { notifyTaskAssigned, notifyTaskUpdated, notifyTaskCompleted, notificationLogger } = require("../utils/notificationHelper");

//create worker (supports file upload: req.file)
exports.createWorker = async(req, res)=>{
    try{
        const {name, email, password} = req.body;
        if(!name || !email || !password)
            return res.status(400).json({message: "All fields are required"});
        const exist = await User.findOne({email});
        if(exist)
            return res.status(400).json({message: "Email Already Exist"});
        //passsword hashes
        const hashed = await bcrypt.hash(password, 10);
        const worker = new User({
            name,
            email,
            password: hashed,
            role: "worker",
            profileImage: req.file ? `/uploads/${req.file.filename}` :undefined,
        });
       await worker.save();
       return res.status(201).json({message: "Worker Created Successfully", worker: {id: worker._id, name: worker.name, email: worker.email, profileImage: worker.profileImage} })
    }catch(err){
 console.error(err);
 return res.status(500).json({message: "Server Error"});
    }
};
//getworkers
exports.getWorkers = async (req, res) =>{
    try{
        const workers = await User.find({role: "worker"}).select("-password").sort({createdAt: -1});
        return res.json({workers});
    }catch(err) {
    console.error(err);
    return res.status(500).json({message: "Server error"});
    }
}
//get workers by id
exports.getWorkerById = async (req, res)=>{
    try{
    const worker = await User.findById(req.params.id).select("-password");
    if(!worker) return res.status(404).json({message: "Worker Not Found"});
    return res.json({worker});
    }catch(err){
        console.log(err);
        return res.status(500).json({message:"Server Error"});
    }
}
//delete worker

exports.deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await User.findByIdAndDelete(id);

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    return res.json({ message: "Worker deleted successfully" });
  } catch (err) {
    console.error("DELETE WORKER ERROR 👉", err);
    return res.status(500).json({ message: "Server error" });
  }
};

//update worker
exports.updateWorker = async(req, res)=>{
    try{
    const worker = await User.findById(req.params.id);
    if(!worker) return res.status(404).json({message: "Worker Not Found"});
    worker.name = req.body.name || worker.name;
    worker.email = req.body.email || worker.email;
    if(req.body.password){
        worker.password = await bcrypt.hash(req.body.password, 10);
    }
    if(req.file){
        worker.profileImage = `/uploads/${req.file.filename}`;
    }
    await worker.save();
    res.json({message: "Worker Updated", worker});
    }catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
    }
}
//Create Task
exports.createTask = async (req, res) =>{
    try{
   const {title, description, priority, assignedTo} = req.body;
   if (!title) return  res.status(400).json({ message: "Title required"});
   const task = new Task({
    title,
    description,
    priority: priority || "medium",
    createdBy: req.user._id,
    assignedTo: assignedTo || undefined,
    attachments: req.files ? req.files.map(f => `/uploads/${f.filename}`): [],
   })
   await task.save();
   
   // Emit socket event and create notification
   if (assignedTo && req.app.get("io")){
    const io = req.app.get("io");
    notificationLogger.info('Task created with assignment', { taskId: task._id, assignedTo });
    
    io.emit("taskAssigned",{
        taskId: task._id,
        title: task.title,
        assignedTo
    });
    
    // Create notification for assigned worker
    try {
        await notifyTaskAssigned(io, {
            taskId: task._id,
            title: task.title,
            assignedTo: assignedTo,
            assignedBy: req.user._id
        });
        notificationLogger.info('Notification created for task assignment', { taskId: task._id });
    } catch (err) {
        notificationLogger.error('Failed to create notification for task assignment', err);
    }
   }
  
   return res.status(201).json({message: "Task created",task});
    }catch(err){
    console.error(err);    
  return  res.status(500).json({message: "Server error"});
    }
};

//Assign Task by Admin
exports.assignTask = async (req, res) =>{
 try{
    const {taskId, workerId} = req.body;
   // if(!taskId || !workerId) return res.status(400).json({message: "All Fields are required xyz"});
    
    console.log( "xyz",taskId,workerId );
    const task = await Task.findById(taskId);
    if(!task) return res.status(404).json({message: "Task Not Found"});
    task.assignedTo = workerId;
    task.status = "pending";
    await task.save();
    
    notificationLogger.info('Task manually assigned', { taskId: task._id, workerId });
    
    //emit socket event and create notification
    if(req.app.get("io")) {
        const io = req.app.get("io");
        io.emit("taskAssigned", {
            taskId: task._id,
            title: task.title,
            assignedTo: workerId
        });
        
        // Create notification for assigned worker
        try {
            await notifyTaskAssigned(io, {
                taskId: task._id,
                title: task.title,
                assignedTo: workerId,
                assignedBy: req.user._id
            });
            notificationLogger.info('Notification created for manual task assignment', { taskId: task._id });
        } catch (err) {
            notificationLogger.error('Failed to create notification for manual task assignment', err);
        }
    }
    return res.json({message: "Task assigned", task});
 }catch(err){
    console.error(err);
 
      return res.status(500).json({message: "Server error"});
 }
};
//Get task
exports.getTasks = async (req, res) => {
    try{
        const {status, workerId} = req.query;
        const filter = {};
        if(status) filter.status = status;
        if(workerId) filter.assignedTo = workerId;
        const tasks = await Task.find(filter).populate("assignedTo", "name email").sort({ createdAt: -1});
        return res.json({tasks});
    }catch(err){
        console.error("error");  
   return  res.status(500).json({message: "Server error"})
    }
}
//get task by id
exports.getTaskById = async (req, res) => {
    try{
        const task = await Task.findById(req.params.id).populate("assignedTo", "name email");
        if(!task) return res.status(404).json({message: "Task Not Found"});
        return res.json({task});
    }catch(err){
console.error(err);

  return res.status(500).json({message: "Server error"})
    }
}
//Update status (worker/admin)
exports.updateTaskStatus = async (req, res) =>{
    try{
        const { status } = req.body;
        const id = req.params.id;

        const task = await Task.findById(id).populate('assignedTo createdBy');
        if (!task) {
            return res.status(404).json({ message: "Task Not Found" });
        }

        const oldStatus = task.status;
        notificationLogger.info('Task status update initiated', { 
            taskId: task._id, 
            oldStatus, 
            newStatus: status,
            updatedBy: req.user._id 
        });
        
        task.status = status;
        await task.save();

        // emit socket event and create notification
        if (req.app.get("io")) {
            const io = req.app.get("io");
            io.emit("taskUpdated", {
                taskId: task._id,
                status: task.status,
            });
            
            // Create notification for status update
            try {
                // If task is completed, use specific completion notification
                if (status === 'completed' && task.createdBy) {
                    await notifyTaskCompleted(io, {
                        taskId: task._id,
                        title: task.title,
                        completedBy: req.user._id,
                        createdBy: task.createdBy._id || task.createdBy,
                        assignedTo: task.assignedTo?._id || task.assignedTo
                    });
                    notificationLogger.info('Task completion notification created', { taskId: task._id });
                } else if (task.assignedTo) {
                    // Regular status update notification
                    await notifyTaskUpdated(io, {
                        taskId: task._id,
                        title: task.title,
                        status: status,
                        oldStatus: oldStatus,
                        updatedBy: req.user._id,
                        assignedTo: task.assignedTo._id || task.assignedTo
                    });
                    notificationLogger.info('Task update notification created', { taskId: task._id });
                }
            } catch (err) {
                notificationLogger.error('Failed to create notification for task update', err);
            }
        }

        return res.json({ message: "Status Updated", task });
    } catch (err) {
        notificationLogger.error('Task status update failed', err);
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getDashboard = async (req, res) => {
    try{
        const totalTasks = await Task.countDocuments();
        const pending = await Task.countDocuments({status: "pending"});
        const inProgress = await Task.countDocuments({status: "in-progress"});
        const completed =await Task.countDocuments({status: "completed"});
        const totalWorkers = await User.countDocuments({role: "worker"});
     
       return    res.json({totalTasks,pending, inProgress, completed, totalWorkers});
    }catch(err) {
        console.error(err);    
      return   res.status(500).json({message: "Server error"})
    }
};
//get admin profile
exports.getAdminProfile = async (req, res) =>{
    const admin = await User.findById(req.user._id).select("-password");
    return res.json({admin});
}
//update admin profile
exports.updateAdminProfile = async (req, res) =>{
    try{
        const admin = await User.findById(req.user._id);
        if(!admin) return res.status(404).json({message: "Admin Not Found"});

        if (!req.user) {
  return res.status(401).json({ message: "Unauthorized" });
}

        admin.name = req.body.name|| admin.name;
        admin.email = req.body.email || admin.email;
        if(req.file){
            admin.profileImage = `/uploads/${req.file.filename}`;        }
        await admin.save();
        return res.json({message: "Profile Updated", admin});
    }catch(err){
    console.error(err);
    return res.status(500).json({message: "Server error"});
    }
}
