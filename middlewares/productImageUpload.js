const multer = require("multer")
const storage  = multer.diskStorage({ 
    destination:(req,res,cb)=>{ 
        cb(null,'./uploads')
    },
    filename:(req,file,cb)=>{
       cb(null, Date.now()+'--'+ file.originalname);
    }
  })
const uploadImage = multer({storage}).array('image',3)



module.exports = uploadImage