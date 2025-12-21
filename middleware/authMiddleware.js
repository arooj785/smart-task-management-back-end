const jwt = require("jsonwebtoken");
const User = require("../models/User");
exports.protect = async(req,res,next) =>{
    try{
        const auth = req.headers.authorization;
        if(!auth || !auth.startsWith("Bearer")){
            return res.status(401).json({message:"Not authorized"});
        }
        const token = auth.split(" ")[1];
        //verify token
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        //get user from token
     const user = await User.findById(decoded.id).select("-password");
     if(!user) return res.status(401).json({message:"Not authorized, user not found"});
     req.user = user;
        next();

    }catch(err){
  return res.status(401).json({message: "Token Invalid or Expired"});
    }
};
exports.adminOnly = (req,res,next)=>{
  if(!req.user || req.user.role!=="admin"){
    return res.status(403).json({message:"Admin access only"});
  }
  next();
};