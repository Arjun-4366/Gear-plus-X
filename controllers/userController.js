const userModel = require("../models/userDetails");
const productModel = require("../models/productDetails");
const cartModel = require("../models/cartDetails");
const addressModel = require("../models/addressDetails");
const couponModel = require("../models/couponDetails");
const orderModel = require("../models/orderDetails");

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const generateOtp = require("../public/service/generateOtp");
const Razorpay = require("razorpay");
const today = require("../middlewares/orderDate");
const pdf = require("html-pdf");
const password = require('generate-password')

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});
let page = 1;
let limit = 20;
const pagination = async (page, limit) => {
  try {
    productList = await productModel
      .find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await productModel.find().countDocuments();
    const totalPages = Math.ceil(count / limit);
    return {
      productList: productList,
      totalPages: totalPages,
    };
  } catch (error) {
    console.log(error.message);
  }
};

const securedPassword = async (password) => {
  const hashedPassword = bcrypt.hash(password, 10);
  return hashedPassword;
};

// Loading Home page and user Home

const homePageLoad = async (req, res) => {
  try {
    const userId = req.session.userData ? req.session.userData._id : null;
    const image = req.session.userData ? req.session.userData.image : null;

    if (req.query.page) {
      page = req.query.page;
    }
    const { productList, totalPages } = await pagination(page, limit);
    const cart = await cartModel.findOne({ userId });

    if (userId) {
      res.render("userHome", {
        user: "",
        userId: userId,
        image: image,
        productList: productList,
        cart: cart,
        totalPages: totalPages,
        currentPage: page,
      });
    } else {
      res.render("homePage", {
        productList: productList,
        userId: userId,
        image: image,
        totalPages: totalPages,
        currentPage: page,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// getting user login section

const userLoginPageload = async (req, res) => {
  try {
    res.render("userLogin");
  } catch (error) {
    console.log(error.message);
  }
};

// getting user SignIn section

const userRegisterLoad = async (req, res) => {
  try {
    res.render("userRegister");
  } catch (error) {
    console.log(error.message);
  }
};


// verifying the email

const sendEmail = (message, name, email) => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    secure: false,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: email,
    subject: "Your OTP for GearPlusX",
    html: `hai ${name} this is your login otp ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log("Email has been sent successfully", info.response);
    }
  });
};


// Getting user Input data and storing in dataBase

const userRegisterGetData = async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    if (password !== confirmPassword) {
      res.render("userRegister", { message: "password does not match" });
    } else {
      const secPassword = await securedPassword(password);
      const { name, email, mobile } = req.body;
      console.log(req.file);
      req.session.userData = req.body;
      const existingEmail = await userModel.findOne({ email });
      if (existingEmail) {
        res.render("userRegister", {
          message:
            "Email is alreday exist !! Try with new Email OR Login with existing email",
        });
      } else {
        const userDetails = await new userModel({
          name: name,
          email: email,
          mobile: mobile,
          image: req.file.path,
          password: secPassword,
        });

        const saveUserDetails = await userDetails.save();
        req.session.user = saveUserDetails;
        let generatedMessage = generateOtp();
        req.session.otp = generatedMessage;
        req.session.time = new Date().getTime();
        if (saveUserDetails) {
          sendEmail(
            generatedMessage,
            saveUserDetails.name,
            saveUserDetails.email
          );
          res.render("userOTP");
        } else {
          res.send("something wrong");
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

// getting otp page

const otpLoginPage = async (req, res) => {
  try {
    res.render("userOTP");
  } catch (error) {
    console.log(error.message);
  }
};

// Resending otp

const resendOtp = async (req, res) => {
  try {
    const name = req.session.userData.name;
    const email = req.session.userData.email;
    const otp = generateOtp();
    req.session.otp = otp;
    req.session.time = new Date().getTime();
    sendEmail(otp, name, email);
    res.redirect("/userOTP");
  } catch (error) {
    console.log(error.message);
  }
};

// verifying the OTP

const verifyOtp = async (req, res) => {
  try {
    const otp = req.session.otp;
    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    console.log(" time", currentTime);
    console.log("current time", req.session.time);
    const timeDifference = currentTime - req.session.time;
    console.log("difference", timeDifference);
    const userId = req.session.user._id;
    console.log("UserID:", userId);
    console.log("Stored OTP:", otp);

    console.log("Received OTP:", req.body.otp);
    console.log("Stored OTP:", otp);
    if (timeDifference <= 300000) {
      if (req.body.otp == otp) {
        const updatedUser = await userModel.findByIdAndUpdate(
          userId,
          { $set: { isVerified: 1 } },
          { new: true }
        );
        console.log(updatedUser);
        if (updatedUser) {
          res.render("userLogin");
        } else {
          throw new Error("failed to update the user");
        }
      } else {
        console.log("Incorrect OTP");
        res.send("Incorrect OTP");
      }
    } else {
      res.render("userOTP", { message: "otp expired" });
    }
  } catch (error) {
    console.log("Error during verification:", error.message);
    res.send("Error during verification");
  }
};

// verifying the input Details for userLogin

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const referenceData = await userModel.findOne({ email: email });

    if (req.query.page) {
      page = req.query.page;
    }
    const productList = await productModel
      .find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    let count = await productModel.find().countDocuments();
    let totalPages = Math.ceil(count / limit);

    req.session.userData = referenceData;
    const userId = req.session.userData._id;
    const cartItems = await cartModel.findOne({ userId });
    if(!cartItems){
      const newCart = await new cartModel({
        userId:userId,
        items:[]
      })
      await newCart.save()
    }
     const cart =  await cartModel.findOne({ userId })
    const image = req.session.userData.image;

    if (referenceData) {
      if (referenceData.isBlocked == false) {
        const passwordCheck = await bcrypt.compare(
          password,
          referenceData.password
        );
        if (passwordCheck && referenceData.isAdmin == 0) {
          if (referenceData.isVerified == 1) {
            res.render("userHome", {
              user: "",
              userId: userId,
              image: image,
              productList: productList,
              cart:cart,
              totalPages: totalPages,
            });
          } else {
            res.render("userLogin", { message: "user is not verified" });
          }
        } else {
          res.render("userLogin", { message: "Invalid password" });
        }
      } else {
        res.render("userLogin", {
          message: "You have been locked by the admin!! Try again later",
        });
      }
    } else {
      res.render("userLogin", { message: "Not a registered user" });
    }
  
   
  } catch (error) {
    console.log(error.message);
  }
};

// Login using google

const successGoogleLogin = async (req, res) => {
  try {
    if (!req.user) {
      res.redirect("/failure");
    } else  {
      console.log(req.user);
      const referenceData = await userModel.findOne({ email: req.user.email });
      if(referenceData && referenceData.modeOfLogin == 'google'){
        if (req.query.page) {
          page = req.query.page;
        }
        const productList = await productModel
          .find()
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .exec();
        let count = await productModel.find().countDocuments();
        let totalPages = Math.ceil(count / limit);
        req.session.userData = referenceData;
        const userId = req.session.userData._id;
        const image = req.session.userData.image;
        const cart = await cartModel.findOne({ userId });
        if (referenceData) {
          if (referenceData.isBlocked == false) {
                res.render("userHome", {
                  user: "",
                  userId: userId,
                  image: image,
                  productList: productList,
                  cart: cart,
                  totalPages: totalPages,
                });
                let customerAddress = await addressModel.findOne({ userId });
                if (!customerAddress) {
                  customerAddress = await new addressModel({
                    userId: userId,
                    userAddress: [],
                  });
                }
                await customerAddress.save();
          } else {
            res.render("userLogin", {
              message: "You have been locked by the admin!! Try again later",
            });
          }
        }
      }
      else{
        const randomPassword  = password.generate({
          length:10,
          numbers:true,
        })
        console.log('random password',randomPassword)
        const secPassword  = await securedPassword(randomPassword)
        console.log('securePassword',secPassword)
        const userDetails = await new userModel({
          name: req.user.displayName,
          email: req.user.email,
          image: req.user.picture,
          password: secPassword,
          isAdmin:0,
          isBlocked:false,
          isVerified:true,
          modeOfLogin:'google'
        });
        const saveUserDetails = await userDetails.save()
        req.session.userData = saveUserDetails
        if (req.query.page) {
          page = req.query.page;
        }
        const productList = await productModel
          .find()
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .exec();
        let count = await productModel.find().countDocuments();
        let totalPages = Math.ceil(count / limit);
        req.session.userData = saveUserDetails;
        console.log('')
        const userId = req.session.userData._id;
        const image = req.session.userData.image;
        const cartItems = await cartModel.findOne({ userId });
        if(!cartItems){
          const newCart = await new cartModel({
            userId:userId,
            items:[]
          })
          await newCart.save()
        }
        const cart = await cartModel.findOne({userId})
        res.render("userHome", {
          user: "",
          userId: userId,
          image: image,
          productList: productList,
          cart: cart,
          totalPages: totalPages,
        });
   
      }
  } 
}
  catch (error) {
    console.log(error.message);
  }

}
// google login failure

const failureGoogleLogin = async (req, res) => {
  try {
    res.send("failure");
  } catch (error) {
    console.log(error.message);
  }
};

// user Logout section
const userLogout = async (req, res) => {
  try {
    console.log("Before destroying session");
    console.log(req.session);
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.log("Error destroying session:", err);
        } else {
          console.log("Session destroyed successfully");
          console.log(req.session);
          res.redirect("/");
        }
      });
    } else {
      console.log("No session to destroy");
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// my profile page

const getMyProfile = async (req, res) => {
  try {
    const id = req.query.id;
    const itemid = req.query.itemId;
    req.session.itemId = itemid;
    console.log("itemId", itemid);
    const user = await userModel.findById({ _id: id });
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    const newAddress = await addressModel.findOne({ userId });
    console.log(user);
    res.render("myProfile", {
      user: user,
      userId: userId,
      image: image,
      cart,
      newAddress,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// updating profile

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const { name, email, mobile } = req.body;

      const user = await userModel.findByIdAndUpdate(
        { _id: req.query.id },
        {
          $set: {
            name: name,
            email: email,
            mobile: mobile,
            image: req.file.path,
          },
        },
        { new: true }
      );
      req.session.userData = user;
    } else {
      const { name, email, mobile } = req.body;
      const user = await userModel.findByIdAndUpdate(
        { _id: req.query.id },
        { $set: { name: name, email: email, number: mobile } },
        { new: true }
      );
      req.session.userData = user;
    }
    res.redirect("/userHome");
  } catch (error) {
    console.log(error.message);
  }
};

// getting add new address  page

const addAddress = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    res.render("addAddress", { userId, image, cart });
  } catch (error) {
    console.log(error.message);
  }
};

// updating user address

const updateAddress = async (req, res) => {
  try {
    const addressId = req.body.address;
    console.log("addressId", addressId);
    const userId = req.session.userData._id;
    const itemId = req.session.itemId;
    console.log("itemId", itemId);
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    const newAddress = await addressModel.findOne({ userId });
    console.log("userId", userId);
    const chosenAddress = newAddress.userAddress.find(
      (address) => address._id.toString() == addressId
    );
    newAddress.userAddress.map(async (address) => {
      if (address._id.toString() !== addressId) {
        address.isSelected = false;
        await address.save();
      }
    });

    chosenAddress.isSelected = true;
    console.log("Chosen Address", chosenAddress);
    const order = await orderModel.findOne({ userId });
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $set: { userAddress: newAddress._id } },
      { new: true }
    );

    const specificOrder = order.userOrders.find(
      (item) => item._id.toString() === itemId
    );
    if (specificOrder) {
      specificOrder.shippingAddress = addressId;
    }

    await order.save();
    await user.save();
    await newAddress.save();
    res.redirect("/myOrders");
  } catch (error) {
    console.log(error.message);
  }
};


// Registering new address

const registerAddress = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const user = await userModel.findById(userId);
    const { firstName, lastName, city, pin, address, email } = req.body;
    let customerAddress = await addressModel.findOne({ userId });
    if (!customerAddress) {
      customerAddress = await new addressModel({
        userId: userId,
        userAddress: [],
      });
      customerAddress.userAddress.push({
        firstName: firstName,
        lastName: lastName,
        city: city,
        pin: pin,
        address: address,
        email: email,
        isSelected: true,
      });
    } else {
      customerAddress.userAddress.push({
        firstName: firstName,
        lastName: lastName,
        city: city,
        pin: pin,
        address: address,
        email: email,
      });
    }
    await customerAddress.save();
    req.session.address = customerAddress;
     res.redirect('/userHome')
  } catch (error) {
    console.log(error.message);
  }
}

// cart page

const getCartPage = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const user = await userModel.findById(userId);
    const product = await productModel.find();
    const cartProducts = await cartModel
      .findOne({ userId })
      .populate("items.product");

    req.session.cart = cartProducts;

    await cartProducts.save();

    if (cartProducts.items.length != 0) {
      res.render("cartPage", {
        cart: cartProducts,
        userId,
        image,
        user: user,
        product: product,
      });
    } else {
      res.render("cartPage", {
        cart: cartProducts,
        userId,
        image,
        user: user,
        product: product,
        message: "",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// add to cart feature

const addToCart = async (req, res) => {
  try {
    const image = req.session.userData.image;
    const productId = req.query.id;
    console.log(productId);
    const product = await productModel.findById(productId);
    if (!product) {
      res.send("product is not availabale now");
    }
    const userId = req.session.userData._id;
    let cart = await cartModel.findOne({ userId });
    if (!cart) {
      cart = await new cartModel({
        userId: userId,
        items: [],
        totalPrice: "0",
        deliveryFee: "40",
      });
    }
    const cartProduct = await cart.items.find((item) =>
      item.product.equals(product._id)
    );

    let totalPrice = 0;
    let deliveryFee = 40;
    if (cartProduct) {
      cartProduct.quantity += 1;
      cartProduct.price = cartProduct.quantity * product.price;
    } else {
      cart.items.push({
        product: product._id,
        quantity: 1,
        price: product.price,
        basePrice: product.price,
      });
    }
    totalPrice = cart.items.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0
    );
    cart.deliveryFee = deliveryFee.toString();
    cart.totalPrice = totalPrice.toString();
    req.session.totalPrice = cart.totalPrice;
    const updatedCart = await cart.save();
    console.log(updatedCart);
    req.session.cart = await updatedCart;

    res.redirect("/userHome");
  } catch (error) {
    console.log(error.message);
  }
};

// deleting cart items

const deleteCartItem = async (req, res) => {
  try {
 
    const userId = req.session.userData._id;
    const productId = req.query.id;
  

    const updatedCart = await cartModel.findOneAndUpdate(
      { userId },
      { $pull: { items: { product: productId } } },
      { $set: { items: { softDelete: true } } },
      { new: true }
    );
    console.log("updatedcart ", updatedCart);
    if (updatedCart) {
      const cart = await cartModel.findOne({ userId });
      let totalPrice = cart.items.reduce(
        (sum, item) => sum + parseFloat(item.price),
        0
      );
      cart.totalPrice = totalPrice.toString();
      await cart.save();

      res.redirect("/cartPage");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// search products

const searchProducts = async (req, res) => {
  try {
    const search = req.body.search;
    const image = req.session.userData ? req.session.userData.image : null;
    const userId = req.session.userData ? req.session.userData._id : null;
    const cart = await cartModel.findOne({ userId });
  
    if (req.query.page) {
      page = req.query.page;
    }
    const productList = await productModel
      .find({
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          { brand: { $regex: ".*" + search + ".*", $options: "i" } },
          { category: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    let count = await productModel.find().countDocuments();
    let totalPages = Math.ceil(count / limit);
    res.render("userHome", {
      productList: productList,
      image: image,
      userId: userId,
      cart: cart,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error.message); 
  }
};

// filter products

const filterCategories = async (req, res) => {
  try {
    const category = req.query.key;
    const image = req.session.userData ? req.session.userData.image : null;
    const userId = req.session.userData ? req.session.userData._id : null;

    if (req.query.page) {
      page = req.query.page;
    }
    const productList = await productModel
      .find({ category: category })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    let count = await productModel.find().countDocuments();
    let totalPages = Math.ceil(count / limit);
    const cart = await cartModel.findOne({ userId });

    if (productList.length > 0) {
      res.render("userHome", {
        productList: productList,
        image: image,
        userId: userId,
        cart: cart,
        totalPages: totalPages,
      });
    } else {
      res.status(400).send("No products found in this category");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// sorting products by price ascend

const sortByPriceAscend = async (req, res) => {
  try {
    const image = req.session.userData ? req.session.userData.image : null;
    const userId = req.session.userData ? req.session.userData._id : null;

    const cart = await cartModel.findOne({ userId });

    if (req.query.page) {
      page = req.query.page;
    }
    const productList = await productModel
      .find({})
      .sort({ price: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    let count = await productModel.find().countDocuments();
    let totalPages = Math.ceil(count / limit);
    if (productList.length > 0) {
      res.render("userHome", {
        productList: productList,
        image: image,
        userId: userId,
        cart: cart,
        totalPages: totalPages,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// sorting products by price descend

const sortByPriceDescend = async (req, res) => {
  try {
    const image = req.session.userData ? req.session.userData.image : null;
    const userId = req.session.userData ? req.session.userData._id : null;
    const cart = await cartModel.findOne({ userId });

    if (req.query.page) {
      page = req.query.page;
    }
    const productList = await productModel
      .find({})
      .sort({ price: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    let count = await productModel.find().countDocuments();
    let totalPages = Math.ceil(count / limit);
    if (productList.length > 0) {
      res.render("userHome", {
        productList: productList,
        image: image,
        userId: userId,
        cart: cart,
        totalPages: totalPages,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// getting product details page

const getProductDetailsPage = async (req, res) => {
  try {
    const image = req.session.userData ? req.session.userData.image : null;
    const userId = req.session.userData ? req.session.userData._id : null;
    const cart = await cartModel.findOne({ userId });
    const productId = req.query.id;
    const product = await productModel.findById(productId);

    res.render("productInfo", {
      image: image,
      cart: cart,
      userId: userId,
      product: product,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// calulating discount

const discountCalculation = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const newAddress = await addressModel.find();
    const cartId = req.session.cart._id;

    //fetched Data from frontEnd/cartPage

    const itemId = req.body.itemId;
    const newQuantityUpdated = req.body.newQuantity;
    const newTotalUpdated = req.body.newTotal;
    const newSumOfprices = req.body.sumOfPrices;

    // updating quantity and price of cart Model

    const newCart = await cartModel.updateOne(
      { _id: cartId, "items._id": itemId },
      {
        $set: {
          "items.$.quantity": newQuantityUpdated,
          "items.$.price": newTotalUpdated,
          totalPrice: newSumOfprices,
        },
      }
    );

    //coupon Logic

    const cartProducts = await cartModel
      .findOne({ userId })
      .populate("items.product");
    const inputCoupon = req.body.coupon;
    const allCoupons = await couponModel.findOne({ name: inputCoupon });
    if (allCoupons) {
      const discount = allCoupons.discount;
      const totalPrice = cartProducts.totalPrice;
      const finalPrice = (totalPrice * discount) / 100;


      res.render("cartPage", {
        userId,
        image,
        cart: cartProducts,
        discountPrice: finalPrice,
        newQuantityUpdated: newQuantityUpdated,
        newTotalUpdated: newTotalUpdated,
        newAddress: newAddress,
        couponMessage: "coupon applied succesfully",
        coupon: allCoupons,
      });
    } else {
      res.render("cartPage", {
        userId,
        image,
        cart: cartProducts,
        newAddress: newAddress,
        couponMessage: "Invalid Coupon",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// get payment selection Page

const getPaymentSelectionPage = async (req, res) => {
  try {

   
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const newAddress = await addressModel.findOne({userId});
    const cart = await cartModel.findOne({ userId }).populate("items.product");
     
    if(!newAddress || newAddress.userAddress.length==0){
      res.render("addAddress", { userId, image, cart });
    }
    else{
      res.render("paymentPage", { userId, image, cart, message: "" });
    }

  } catch (error) {
    console.log(error.message);
  }
};

// add to wishlist logic

const addToWishlist = async (req, res) => {
  try {
    const productId = req.query.id;
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    const user = await userModel.findById(userId);
    const product = await productModel.findById(productId);
    if (user.wishlist.includes(productId)) {
      const index = user.wishlist.indexOf(productId);
      console.log(index);
      user.wishlist.splice(index, 1);
      await user.save();
      product.isWishlist = false;
      product.save();
      res.render("productInfo", {
        image: image,
        userId: userId,
        cart: cart,
        product: product,
      });
    } else {
      user.wishlist.push(productId);
      await user.save();
      product.isWishlist = true;
      product.save();
      res.render("productInfo", {
        image: image,
        userId: userId,
        cart: cart,
        product: product,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// getting wishlist Page

const getWishListpage = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    const wishlistProducts = await productModel.find({ isWishlist: true });

    res.render("wishlistPage", {
      userId,
      image,
      cart,
      wishlistProducts,
      user: "",
    });
  } catch (error) {
    console.log(error.message);
  }
};

// delete wishlist item

const deleteWishListItem = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    const wishlistProducts = await productModel.find({ isWishlist: true });
    const productId = req.query.id;
    const product = await productModel.findById(productId);
    product.isWishlist = false;
    await product.save();
    res.render("wishlistPage", { userId, image, cart, wishlistProducts });
  } catch (error) {
    console.log(error.message);
  }
};

// get my orders page

const myOrdersPage = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    const allAddress = await addressModel.findOne({ userId });
    let allOrders = await orderModel.findOne({userId})

    if(!allOrders){
      allOrders = await new orderModel({
       userId:userId,
       customerName:req.session.userData.name,
       userOrders:[]
      })
      res.render("myOrders", {
        userId,
        image,
        cart,
        order: allOrders,
        user: "",
        allAddress,
      });
   }else{
    allOrders = await orderModel
    .findOne({ userId })
    .populate("userOrders.productInfo")
    .populate("userOrders.shippingAddress");
  res.render("myOrders", {
    userId,
    image,
    cart,
    order: allOrders,
    user: "",
    allAddress,
  });
   }
 
  } catch (error) {
    console.log(error.message);
  }
};

// download invoice of myorders

const showInvoice = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const image = req.session.userData.image;
    const cart = await cartModel.findOne({ userId });
    const itemId = req.query.id;

    const order = await orderModel.findOne({ userId });

    const specificOrder = order.userOrders.find(
      (item) => item._id.toString() === itemId
    );
    const allOrders = await orderModel.populate(specificOrder, {
      path: "productInfo",
      model: "Products",
    });
    const address = await addressModel.findOne({ userId });
 
    res.render(
      "invoice",
      { userId, image, cart, order: allOrders, address },
      function (err, html) {
        if (err) {
          throw err;
        }
        var options = {
          format: "letter",
        };
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=invoice.pdf"
        );

        pdf.create(html, options).toStream(function (err, stream) {
          if (err) {
            console.log(err);
          }
          stream.pipe(res);
        });
      }
    );
  } catch (error) {
    console.log(error.message);
  }
};

// getting order success page and razorpay logic

const orederSuccesPage = async (req, res) => {
  try {
    const upi = req.body.upiPayment;
    const cod = req.body.cashOnDelivery;
    const userId = req.session.userData._id;
    const contact = req.session.userData.mobile;
    const userName = req.session.userData.name;
    const email = req.session.userData.email;
    if (cod) {
      res.render("orderSuccess");
    } else {
      const cart = await cartModel.findOne({ userId });
      const totalPrice = cart.totalPrice;

      var options = {
        amount: totalPrice * 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: userId,
      };

      instance.orders.create(options, (err, order) => {
        if (!err) {
          res.status(200).send({
            success: true,
            msg: "order delivered",
            order_id: order.id,
            amount: totalPrice * 100,
            key_id: process.env.RAZORPAY_KEY_ID,
            contact: contact,
            userName: userName,
            email: email,
          });
        } else {
          res.status(400).send({ success: false, msg: "something wrong" });
        }
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ success: false, msg: "Internal Server Error" });
  }
};

// confirming order and creating order collection

const orderConfirm = async (req, res) => {
  try {
    let paymentMethod = req.query.pay;
    const invoice = Math.random().toString(36).slice(2).toUpperCase();
    const userId = req.session.userData._id;
    const userAddress = await addressModel.findOne({ userId });
    const cart = await cartModel.findOne({ userId });
    let order = await orderModel.findOne({ userId });
    if (!order) {
      order = await new orderModel({
        userId: userId,
        customerName: req.session.userData.name,
        userOrders: [],
      });
       for(const item of cart.items) {
        const product = await productModel.findById(item.product._id);
        order.userOrders.push({
          productInfo: item.product,
          quantity: item.quantity,
          productCategory:product.category,
          price: item.price,
          shippingAddress: userAddress._id,
          orderDate: today.toString(),
          status: "Placed",
          payment: paymentMethod,
          InvoiceNo: invoice,
        });
        
        product.quantity -= item.quantity;
        console.log('product category',product.category)
        await product.save();
      }

      res.render("orderSuccess");
    } else {
      for(const item of cart.items) {
        const product = await productModel.findById(item.product._id);
        order.userOrders.push({
          productInfo: item.product,
          quantity: item.quantity,
          productCategory:product.category,
          price: item.price,
          shippingAddress: userAddress._id,
          orderDate: today.toString(),
          status: "Placed",
          payment: paymentMethod,
          InvoiceNo: invoice,
        });
      
        product.quantity -= item.quantity;
        console.log('product category',product.category)
           await product.save()
      }

      res.render("orderSuccess");
    }
   
    cart.items = [];
    await order.save();
    await cart.save();
  } catch (error) {
    console.log(error.message);
  }
};
// forgot password reset page
const emailEnterPage = async(req,res)=>{
  try{
   res.render('provideEmail',{message:''})
  }
  catch(error){
    console.log(error.message) 
  }
}

const verifyingEmail = async(req,res)=>{
  try{
    const email = req.body.email
    req.session.email = email
    const user = await userModel.findOne({email})
    if(!user){
      res.render('provideEmail',{message:'Email is not registered'})
    }
    else{

    res.render('newPassword')
    }
  }
  catch(error){
    console.log(error.message)
  }
}
const addNewPassword = async(req,res)=>{
  try{
    
   const password = req.body.password
   const confirmPassword = req.body.confirmPassword
   if(password!=confirmPassword){
    res.render('newPassword')
   }
   else{
     const email = req.session.email
    const secPassword = await securedPassword(password)
    const user = await userModel.findOneAndUpdate({email},{$set:{password:secPassword}},{new:true})
    await user.save()
    res.render('userLogin')
   }
  }
  catch(error){
   console.log(error.message)
  }
} 



module.exports = {
  homePageLoad,
  userLoginPageload,
  userRegisterLoad,
  userRegisterGetData,
  otpLoginPage,
  resendOtp,
  verifyOtp,
  verifyLogin,
  userLogout,
  getMyProfile,
  updateProfile,
  updateAddress,
  addToWishlist,
  getWishListpage,
  getCartPage,
  addToCart,
  addAddress,
  registerAddress,
  deleteCartItem,
  searchProducts,
  filterCategories,
  sortByPriceAscend,
  sortByPriceDescend,
  getProductDetailsPage,
  discountCalculation,
  getPaymentSelectionPage,
  orederSuccesPage,
  deleteWishListItem,
  myOrdersPage,
  showInvoice,
  orderConfirm,
  successGoogleLogin,
  failureGoogleLogin,
  emailEnterPage,
  verifyingEmail,
  addNewPassword
}