import express from "express";
import {
  addShopProduct,
  addToCart,
  editProductDetails,
  getProductData,
  getProductReviewDetails,
  getProductsByQuery,
  getShopProductDetails,
  postProductReview,
  removeCartItem,
  removeProduct,
  updateCartQuantity,
} from "../controllers/productControllers.js";
import { uploadMiddleware } from "../middlewares/multer.js";

const router = new express.Router();

router.post(
  "/create-product",
  uploadMiddleware.array("files", 10),
  addShopProduct
);

router.get("/get-shop-products/:shopId", getShopProductDetails);

router.get("/get-product-details/:productId", getProductData);

router.get("/products-by-query", getProductsByQuery);

router.put(
  "/edit-product-data",
  uploadMiddleware.array("files", 10),
  editProductDetails
);

router.post("/post-product-review", postProductReview);

router.get("/review-details", getProductReviewDetails);

router.delete("/delete-product", removeProduct);

router.post("/add-to-cart", addToCart);

router.post("/update-cart-quantity", updateCartQuantity);

router.put("/remove-cart-item", removeCartItem);

export default router;
