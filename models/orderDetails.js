const mongoose = require('mongoose')
const orderModel = mongoose.Schema({
    userId:{
        type:String,
        require:true
    },
    customerName:{
       type:String,
       require:true
    },
   
    userOrders:[
      
        { 
            productInfo:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Products"
           },
           quantity:{
            type:String,
            require:true
           },
           productCategory:{
            type:String,
            require:true
           },
          price:{
            type:String,
            require:true
          },
            shippingAddress:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Address'
            },
            orderDate:{
                type:String,
                require:true
            },
            status:{
                type:String,
                require:true
            },
            payment:{
                type:String,
                require:true
            },
            deliveryDate:{
                type:String,
                require:true
            },
            InvoiceNo:{
                type:String,
                require:true
            },
        }
    ]
})

module.exports = mongoose.model('Order',orderModel)