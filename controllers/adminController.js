const userModel = require("../models/userDetails");
const productModel = require("../models/productDetails");
const cartModel = require("../models/cartDetails");
const couponModel = require("../models/couponDetails");
const orderModel = require("../models/orderDetails");
const bcrypt = require("bcrypt");

// getting admin Login page

const adminLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.log(error.message);
  }
};

// verify admin login

const loginVerify = async (req, res) => {
  try {
    const { email, password } = req.body;
    const referenceData = await userModel.findOne({ email: email });
    req.session.admin = referenceData;
    if (referenceData) {
      const passwordCheck = await bcrypt.compare(
        password,
        referenceData.password
      );
      if (passwordCheck) {
        if (referenceData.isAdmin == 1 && referenceData.isVerified == 1) {
          const findSumOfQuantities = [
            {
              $unwind: "$userOrders",
            },
            {
              $group: {
                _id: "$userOrders.productCategory",
                totalQuantity: { $sum: { $toInt: "$userOrders.quantity" } },
              },
            },
          ];
          const findOrdersByDate = [
            {
              $unwind: "$userOrders",
            },
            {
              $group: {
                _id: "$userOrders.orderDate",
                totalOrders: { $sum: { $toInt: "$userOrders.quantity" } },
              },
            },
          ];
          const saleAmount = [
            {
              $unwind: "$userOrders",
            },
            {
              $group: {
                _id: null,
                saleAmount: { $sum: { $toInt: "$userOrders.price" } },
              },
            },
          ];
          const totalOrdersByDate = await orderModel.aggregate(
            findOrdersByDate
          );
          const totalQuantities = await orderModel.aggregate(
            findSumOfQuantities
          );
          const totalSaleAmount = await orderModel.aggregate(saleAmount);
          let totalSale;
          totalSaleAmount.forEach((elem) => {
            totalSale = elem.saleAmount;
          });
          let categoryData = [];
          let categoryLabel = [];
          let dateData = [];
          let dateLabel = [];

          totalQuantities.forEach((item) => {
            categoryData.push(item.totalQuantity);
            categoryLabel.push(item._id);
          });
          totalOrdersByDate.forEach((item) => {
            dateData.push(item.totalOrders);
            dateLabel.push(item._id);
          });
          const pieData = {
            labels: categoryLabel,
            datasets: [
              {
                label: "Product Sale By Categories",
                data: categoryData,
                borderWidth: 1,
              },
            ],
          };
          const barData = {
            labels: dateLabel,
            datasets: [
              {
                data: dateData,
                label: "Product Sale By Date",
                borderWidth: 1,
              },
            ],
          };
          res.render("adminDashBoard", { pieData, barData,totalSale });
        } else {
          res.render("adminLogin", { message: "not a verified user" });
        }
      } else {
        res.render("adminLogin", { message: "Not an Admin " });
      }
    } else {
      res.render("adminLogin", { message: "Not a registered user" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// getting Admin DashBoard

const adminDashBoard = async (req, res) => {
  try {
    const findSumOfQuantities = [
      {
        $unwind: "$userOrders",
      },
      {
        $group: {
          _id: "$userOrders.productCategory",
          totalQuantity: { $sum: { $toInt: "$userOrders.quantity" } },
        },
      },
    ];
    const findOrdersByDate = [
      {
        $unwind: "$userOrders",
      },
      {
        $group: {
          _id: "$userOrders.orderDate",
          totalOrders: { $sum: { $toInt: "$userOrders.quantity" } },
        },
      },
    ];
    const saleAmount = [
      {
        $unwind: "$userOrders",
      },
      {
        $group: {
          _id: null,
          saleAmount: { $sum: { $toInt: "$userOrders.price" } },
        },
      },
    ];
    const totalOrdersByDate = await orderModel.aggregate(findOrdersByDate);
    const totalQuantities = await orderModel.aggregate(findSumOfQuantities);
    const totalSaleAmount = await orderModel.aggregate(saleAmount);
    let totalSale;
    totalSaleAmount.forEach((elem) => {
      totalSale = elem.saleAmount;
    });

    let categoryData = [];
    let categoryLabel = [];
    let dateData = [];
    let dateLabel = [];

    totalQuantities.forEach((item) => {
      categoryData.push(item.totalQuantity);
      categoryLabel.push(item._id);
    });
    totalOrdersByDate.forEach((item) => {
      dateData.push(item.totalOrders);
      dateLabel.push(item._id);
    });
    const pieData = {
      labels: categoryLabel,
      datasets: [
        {
          label: "Product Sale By Categories",
          data: categoryData,
          borderWidth: 1,
        },
      ],
    };
    const barData = {
      labels: dateLabel,
      datasets: [
        {
          data: dateData,
          label: "Product Sale By Date",
          borderWidth: 1,
        },
      ],
    };
    res.render("adminDashBoard", { pieData, barData, totalSale });
  } catch (error) {
    console.log(error.message);
  }
};

// admin logout

const adminLogout = async (req, res) => {
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
          res.redirect("/adminLogin");
        }
      });
    } else {
      console.log("No session to destroy");
      res.redirect("/adminLogin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// getting users list

const userList = async (req, res) => {
  try {
    const userDetails = await userModel.find({ isAdmin: 0 });
    res.render("userList", { user: userDetails });
  } catch (error) {
    console.log(error.message);
  }
};

// deleting user

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await userModel.deleteOne({ _id: id });
    res.redirect("/userList");
  } catch (error) {
    console.log(error.message);
  }
};

// block user

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await userModel.findById(id);
    if (user) {
      user.isBlocked = !user.isBlocked;
      await user.save();
      const userData = await userModel.find({ isAdmin: 0 });
      res.render("userList", { user: userData });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// add product page

const addNewProductForm = async (req, res) => {
  try {
    res.render("addProduct");
  } catch (error) {
    console.log(error.message);
  }
};

// add product logic

const addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      quantity,
      price,
      discription,
      details,
      discount,
    } = req.body;
    let newPrice;
    if (discount > 0) {
      newPrice = Math.ceil(price - price * (discount / 100));
    } else {
      newPrice = price;
    }
    const images = req.files.map((file) => file.path);
    const product = await new productModel({
      name: name,
      category: category,
      brand: brand,
      quantity: quantity,
      price: price,
      discountedPrice: newPrice,
      discription: discription,
      details: details,
      discount: discount,
      image: images,
    });
    const productDetails = await product.save();
    if (productDetails) {
      res.redirect("/addProduct");
    } else {
      res.send("something wrong");
    }
  } catch (error) {
    console.log(error.message);
  }
};
// getting all the product list

const getProductList = async (req, res) => {
  try {
    const productList = await productModel.find();
    req.session.productData = productList;
    res.render("productList", { productList: productList });
  } catch (error) {
    console.log(error.message);
  }
};

// delete products

const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const product = await productModel.deleteOne({ _id: productId });
    const userId = req.session.userData._id;
    const updatedCart = await cartModel.findOneAndUpdate(
      { userId },
      { $pull: { items: { product: productId } } },
      { new: true }
    );
    res.redirect("/productList");
  } catch (error) {
    console.log(error.message);
  }
};

// edit product page

const getProductEditPage = async (req, res) => {
  try {
    const productId = req.query.id;
    const product = await productModel.findById(productId);
    console.log(product);
    res.render("productEdit", { product: product });
  } catch (error) {
    console.log(error.message);
  }
};

// edit product logic

const editProduct = async (req, res) => {
  try {
    let {
      name,
      category,
      brand,
      quantity,
      price,
      discription,
      details,
      discount,
    } = req.body;
    let newPrice;
    if (discount > 0) {
      newPrice = Math.ceil(price - price * (discount / 100));
    } else {
      newPrice = price;
    }
    if (req.files && req.files.length > 0) {
      const images = req.files.map((file) => file.path);
      const product = await productModel.findByIdAndUpdate(
        { _id: req.query.id },
        {
          $set: {
            name: name,
            category: category,
            brand: brand,
            quantity: quantity,
            price: price,
            discription: discription,
            details: details,
            discount: discount,
            discountedPrice: newPrice,
            image: images,
          },
        },
        { new: true }
      );
    } else {
      const product = await productModel.findByIdAndUpdate(
        { _id: req.query.id },
        {
          $set: {
            name: name,
            category: category,
            brand: brand,
            quantity: quantity,
            price: price,
            discription: discription,
            details: details,
            discount: discount,
            discountedPrice: newPrice,
          },
        },
        { new: true }
      );
    }

    res.redirect("/productList");
  } catch (error) {
    console.log(error.message);
  }
};

// delete product image logic

const deleteProductImage = async (req, res) => {
  try {
    const productId = req.query.id;
    const index = req.query.index;
    const productDetails = await productModel.findById(productId);
    if (!productDetails) {
      return res.status(404).json({ message: "Product not found" });
    }
    productDetails.image.splice(index, 1);
    await productDetails.save();

    res.render("productEdit", { product: productDetails });
  } catch (error) {
    console.log(error.message);
  }
};

// add new coupon page

const couponAddPage = async (req, res) => {
  try {
    res.render("addCoupons");
  } catch (error) {
    console.log(error.message);
  }
};

// add new coupon logic

const addNewCoupon = async (req, res) => {
  try {
    const { name, discount } = req.body;
    const newCoupon = await new couponModel({
      name: name,
      discount: discount,
    });
    await newCoupon.save();
    res.redirect("/addCoupons");
  } catch (error) {
    console.log(error.message);
  }
};

// getting user orders page
const userOrders = async (req, res) => {
  try {
    const userId = req.query.id;

    const order = await orderModel
      .findOne({ userId })
      .populate("userOrders.productInfo")
      .populate("userOrders.shippingAddress");
    console.log("userorder", order);
    const cart = await cartModel.findOne({ userId });
    res.render("userOrders", { order: order, cart, userId });
  } catch (error) {
    console.log(error.message);
  }
};

// updating user order status logic

const changeOrderStatus = async (req, res) => {
  try {
    const status = req.body.status;
    const userId = req.query.id;
    const itemId = req.query.itemId;
    const order = await orderModel.findOne({ userId });
    const specificOrder = order.userOrders.find(
      (item) => item._id.toString() === itemId
    );
    if (
      status === "Placed" ||
      status === "Dispatched" ||
      status === "Out For Delivery" ||
      status === "Delivered"
    ) {
      specificOrder.status = status;

      await specificOrder.save();
    } else {
      console.log("invalid status", status);
    }
    await order.save();
    const savedOrderModel = await orderModel
      .findOne({ userId })
      .populate("userOrders.productInfo")
      .populate("userOrders.shippingAddress");
    res.render("userOrders", { order: savedOrderModel, userId });
  } catch (error) {
    console.log(error.message);
  }
};

// get all orders of all users

const getAllOrders = async (req, res) => {
  try {
    const order = await orderModel.find().populate("userOrders.productInfo");
    res.render("allOrders", { order });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  adminLogin,
  loginVerify,
  adminDashBoard,
  adminLogout,
  userList,
  deleteUser,
  blockUser,
  addNewProductForm,
  addProduct,
  getProductList,
  deleteProduct,
  getProductEditPage,
  editProduct,
  deleteProductImage,
  couponAddPage,
  addNewCoupon,
  userOrders,
  changeOrderStatus,
  getAllOrders,
};
