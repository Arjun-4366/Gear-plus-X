const mongoose = require("mongoose");
const cartModel = mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        require:true

    },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
      },
      quantity: Number,
      basePrice:String,
      price:String,
    },
  ],
 
  totalPrice:String,
  deliveryFee:String,
});

const cartDatabase = mongoose.model("Cart", cartModel);
module.exports = cartDatabase;
