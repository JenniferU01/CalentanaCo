// routes/shop.routes.js
const express = require("express");
const router = express.Router();

const shopController = require("../controllers/shop.controller");

// Público
router.get("/", shopController.home);
router.get("/menu", shopController.menu);

// Carrito
router.get("/cart", shopController.cart);
router.post("/cart/add", shopController.addToCart);
router.post("/cart/remove", shopController.removeFromCart);
router.post("/cart/clear", shopController.clearCart);

// Checkout -> crea pedido en BD y redirige a WhatsApp
router.post("/checkout", shopController.checkoutPost);

// Success page
router.get("/order/success", shopController.orderSuccessGet);

module.exports = router;
