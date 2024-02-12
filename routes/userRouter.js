const express = require("express");
const userRouter = express();
const session = require("express-session");
userRouter.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

const userController = require("../controllers/userController");
const upload = require("../middlewares/userImageUpload");
const passport = require("../middlewares/googleLogin");
userRouter.use(passport.initialize());
userRouter.use(passport.session());
userRouter.set("view engine", "ejs");
userRouter.set("views", "./views/user");
userRouter.use(express.json());
userRouter.use(express.urlencoded({ extended: true }));

userRouter.use(express.static(__dirname + "/public"));
userRouter.use("/uploads", express.static("uploads"));

// LOGIN & SIGNIN //
userRouter.get("/userLogin", userController.userLoginPageload);
userRouter.get("/userRegister", userController.userRegisterLoad);
userRouter.post("/registerData", upload, userController.userRegisterGetData);
userRouter.get("/userOTP", userController.otpLoginPage);
userRouter.post("/userLogin", userController.verifyOtp);
userRouter.post("/userHome", userController.verifyLogin);
userRouter.get("/forgotPassword", userController.emailEnterPage);
userRouter.post("/newPassword", userController.verifyingEmail);
userRouter.post("/addNewPassword", userController.addNewPassword);
userRouter.get("/resendOtp", userController.resendOtp);
// google authentication
userRouter.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
// authentication call back
userRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/success",
    failureRedirect: "/failure",
  })
);
// success
userRouter.get("/success", userController.successGoogleLogin);
// failure
userRouter.get("/failure", userController.failureGoogleLogin);

// homePage & UserHome Page
userRouter.get("/", userController.homePageLoad);
userRouter.get("/userHome", userController.homePageLoad);

// User profile & Address Management
userRouter.get("/myProfile", userController.getMyProfile);
userRouter.post("/updateProfile", upload, userController.updateProfile);
userRouter.post("/chooseAddress", userController.updateAddress);
userRouter.get("/addAddress", userController.addAddress);
userRouter.post("/registerAddress", userController.registerAddress);

// search,sort & categories
userRouter.post("/searchProducts", userController.searchProducts);
userRouter.get("/categories", userController.filterCategories);
userRouter.get("/sortAscend", userController.sortByPriceAscend);
userRouter.get("/sortDescend", userController.sortByPriceDescend);

// productInfo
userRouter.get("/productInformation", userController.getProductDetailsPage);

// wishlist Routes
userRouter.get("/wishlist", userController.getWishListpage);
userRouter.post("/addToWishlist", userController.addToWishlist);
userRouter.get("/deleteWishlist", userController.deleteWishListItem);

// My orders
userRouter.get("/myOrders", userController.myOrdersPage);
userRouter.get("/invoice", userController.showInvoice);

//  cart routes
userRouter.get("/cartPage", userController.getCartPage);
userRouter.post("/addToCart", userController.addToCart);
userRouter.get("/deleteCartItem", userController.deleteCartItem);

// payment section

userRouter.post("/discounts", userController.discountCalculation);
userRouter.get("/choosePayment", userController.getPaymentSelectionPage);
userRouter.get("/orderSuccess", userController.orderConfirm);
userRouter.post("/upiPayment", userController.orederSuccesPage);

// logOut
userRouter.get("/userLogout", userController.userLogout);

module.exports = userRouter;
