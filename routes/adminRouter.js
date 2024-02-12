const express = require("express");
const adminRoute = express();
const session = require("express-session");
adminRoute.use(
  session({
    secret: process.env.ADMIN_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
const adminAuthentication = require("../middlewares/adminAuth");
const adminController = require("../controllers/adminController");
const uploadImage = require("../middlewares/productImageUpload");
require("dotenv").config();
adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");
adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));
adminRoute.use(express.static(__dirname + "/public"));
adminRoute.use("/uploads", express.static("uploads"));

// login
adminRoute.get("/adminLogin", adminController.adminLogin);
adminRoute.post("/verifyLogin", adminController.loginVerify);

// Admin dashboard
adminRoute.get(
  "/adminDashBoard",
  adminAuthentication,
  adminController.adminDashBoard
);

// Logout
adminRoute.get("/adminLogout", adminController.adminLogout);

// user Management
adminRoute.get("/userList", adminController.userList);
adminRoute.get("/userDelete", adminController.deleteUser);
adminRoute.get("/userBlocked", adminController.blockUser);
adminRoute.get("/userOrders", adminController.userOrders);

//product Management//
adminRoute.get("/productEdit", adminController.getProductEditPage);
adminRoute.post("/editProduct", uploadImage, adminController.editProduct);
adminRoute.get("/addProduct", adminController.addNewProductForm);
adminRoute.post("/addProduct", uploadImage, adminController.addProduct);
adminRoute.get("/productList", adminController.getProductList);
adminRoute.get("/productDelete", adminController.deleteProduct);
adminRoute.get("/imageDelete", adminController.deleteProductImage);
adminRoute.post("/orderStatus", adminController.changeOrderStatus);
adminRoute.get("/addCoupons", adminController.couponAddPage);
adminRoute.post("/createCoupon", adminController.addNewCoupon);

// order routes
adminRoute.post("/orderStatus", adminController.changeOrderStatus);
adminRoute.get("/allOrders", adminController.getAllOrders);

module.exports = adminRoute;
