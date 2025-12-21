const mongoose = require("mongoose");
const TaskSchema = new mongoose.Schema({
    title:{
        type: String,
        requiered: true
    },
    description:{
        type: String,       
    },
    priority:{
        type: String,
        enum:["low","medium","high"],
        default: "medium"
    },
    status:{
        type: String,
        enum:["pending","in-progress","completed"],
        default: "pending"
    },
    assignedTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    attachments:[{type:String  }],
},{timestamps:true});

module.exports = mongoose.model("Task", TaskSchema);