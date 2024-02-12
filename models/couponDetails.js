const mongoose = require('mongoose')

const couponModel = mongoose.Schema({
    name:{
        type:String,
        require:true,
        uppercase:true
    },
   discount:{
    type:Number,
    require:true
   },
  usedBy:{
    type:Array,
    require:true
  }
})


module.exports = mongoose.model('Coupons',couponModel)