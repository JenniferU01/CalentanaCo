const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");

/* =========================
   MIDDLEWARE ADMIN
========================= */
function isAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  next();
}

/* =========================
   ADMIN HOME → DASHBOARD
========================= */
router.get("/", isAdmin, (req, res) => {
  return res.redirect("/admin/dashboard");
});

/* =========================
   DASHBOARD
========================= */
router.get("/dashboard", isAdmin, (req, res) => {
  return res.render("admin/dashboard", {
    title: "Dashboard - CalentanaCo",
  });
});

/* =========================
   PRODUCTOS
========================= */
router.get("/products", isAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.render("admin/products", {
      title: "Productos - CalentanaCo",
      products,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.render("admin/products", {
      title: "Productos - CalentanaCo",
      products: [],
      error: "Error cargando productos",
    });
  }
});

/* =========================
   PEDIDOS (LISTADO)
========================= */
router.get("/orders", isAdmin, async (req, res) => {
  try {
    const status = req.query.status || "all";
    const filter = {};

    if (status !== "all") filter.status = status;

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return res.render("admin/orders", {
      title: "Pedidos - CalentanaCo",
      orders,
      currentStatus: status,
      error: null, // ✅ IMPORTANTE
    });
  } catch (error) {
    console.error(error);
    return res.render("admin/orders", {
      title: "Pedidos - CalentanaCo",
      orders: [],
      currentStatus: "all",
      error: "Error cargando pedidos", // ✅ IMPORTANTE
    });
  }
});

/* =========================
   PEDIDO (DETALLE)
========================= */
router.get("/orders/:id", isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.redirect("/admin/orders");

    return res.render("admin/order-detail", {
      title: "Pedido - CalentanaCo",
      order,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error cargando pedido");
  }
});

/* =========================
   CAMBIAR ESTADO DEL PEDIDO
========================= */
router.post("/orders/:id/status", isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    await Order.findByIdAndUpdate(req.params.id, { status });

    return res.redirect(`/admin/orders/${req.params.id}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error actualizando estado");
  }
});

/* =========================
   LOGOUT
========================= */
router.get("/logout", isAdmin, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
