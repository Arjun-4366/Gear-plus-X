const mongoose = require('mongoose')
const productModel = mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    brand:{
        type:String,
        require:true
    },
    category:{
        type:String,
        require:true
    },
    quantity:{
        type:String,
        require:true
    },  
    price:{
        type:Number,
        require:true
    },
    discription:{
        type:String,
        require:true
    },
    details:{
        type:Array,
        require:true
    },
    discount:{
        type:Number,
        default:0
    },
    discountedPrice:{
        type:Number,
        
    },
    image:
        {
            type:Array,
            require:true
        },
    
    isWishlist:{
        type:Boolean,
        
    }
  
    },{timestamps:true})


const productDatabase = mongoose.model('Products',productModel)
module.exports = productDatabase