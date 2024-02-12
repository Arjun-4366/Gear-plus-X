const mongoose = require('mongoose')

const addressModel = mongoose.Schema({
  userId:{
    type:String,
    require:true
  },
  userAddress:[
{
  firstName:{
    type:String,
    require:true
   },
   mobile:{
    type:String,
    require:true
   },
   city:{
    type:String,
    require:true
   },
   pin:{
    type:String,
    require:true
   },
   address:{
    type:String,
    require:true
   },
   email:{
    type:String,
    require:true
   },
  isSelected:{
   type:Boolean,
   require:true
  }
}
]
})


module.exports = mongoose.model('Address',addressModel)