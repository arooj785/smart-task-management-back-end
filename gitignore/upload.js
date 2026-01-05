const multer = require("multer");
const path = require("path");
const fs = require("fs");

//Set storage engine
const uploadDir = path.join(__dirname, "..", "uploads");
if(!fs.existsSync(uploadDir))
    fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: function(req,file,cb)
{
    cb(null,uploadDir);
},
filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + "-" + Date.now() + ext;
    cb(null, name);
},
});
const fileFilter = (req, file, cb) => {
    //Accept images only
    const allowed = /jpeg|jpg|png|pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if(allowed.test(ext)) cb(null, true);
    else cb(null,  false);
};
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;