const mongoose = require('mongoose')

const userModel = mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    mobile:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    image:{
        type:String,
        data:Buffer
    },
    isAdmin:{
        type:Number,
        default:0
    },
    isVerified:{
        type:Number,
        default:0
    },
    isBlocked:{
        type:Boolean,
        default:false

    },
    userAddress:{
        type:Array,
       require:true
    },
    wishlist:{
        type:Array,
        require:true
      },
      modeOfLogin:{
        type:String
      }
  
})


module.exports = mongoose.model('Users',userModel)