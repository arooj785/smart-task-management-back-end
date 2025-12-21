const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Signup Admin
exports.signup = async(req,res) =>{
    try{
  const  {name, email, password} = req.body;
  if(!name || !email || !password)
    return res.status(400),json({message: "All fields Required"});
  //check email
  const user = await User.findOne({email});

  if(user){
    return res.status(400).json({message:"User already exists"});
  }

  //hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  //create admin user
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role:"admin"
  });
  await newUser.save();

  //response
  res.status(201).json({message: "Admin Created Successfully"})
    }catch(error){
  res.status(500).json({message:"Server error"})
    }
}

//Login (Admin or Worker)
exports.login = async(req,res)=>{
    try{
  const {email , password} = req.body;
  if(!email || !password) return
  res.status(400).json({message: "All fields required"});
  //Find user
  const user = await User.findOne({email});
  if(!user) 
 return  res.status(400).json({message :"Invalid Credentials"});
//check password
const isMatch = await bcrypt.compare(password, user.password);
if(!isMatch) 
    return res.status(400).json({message: "Invalid Credentials "});

//create token
 const token = jwt.sign(
    {id: user._id, role: user.role},
    process.env.JWT_SECRET,
    {expiresIn: "1d"}
 );
 //response
 res.status(200).json({token, role:user.role, name: user.name});
}catch(error){
    res.status(500).json({message:"Server error"});
}
};