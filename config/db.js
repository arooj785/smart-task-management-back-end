const  mongoose= require('mongoose');
require('dotenv').config();
const connectDB = async(req,res) => {
    try{
      const conn =  await mongoose.connect(process.env.MONGO_URL);
        console.log("MONGODB CONNECTED :${conn.connection.host}");
    }catch(error){
        console.log("MONGODB CONNECTION FAILED",error.message);
        process.exit(1);
    }
}
module.exports= connectDB;