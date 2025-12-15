// controllers/admin.controller.js
const Product = require("../models/Product");
const CompanyInfo = require("../models/CompanyInfo");
const Order = require("../models/Order");

/**
 * Normaliza sizes desde distintos formatos de formulario.
 * Soporta:
 * 1) sizes[0][label], sizes[0][price]
 * 2) sizeLabels[] + sizePrices[]
 * 3) v1_label/v1_price + v2_label/v2_price
 */
function normalizeSizes(body) {
  // Caso 1
  if (Array.isArray(body.sizes)) {
    return body.sizes
      .map((s) => ({
        label: (s.label ?? "").toString().trim(),
        price: Number(s.price),
      }))
      .filter((s) => s.label && !Number.isNaN(s.price) && s.price >= 0);
  }

  // Caso 2
  if (body.sizeLabels && body.sizePrices) {
    const labels = Array.isArray(body.sizeLabels) ? body.sizeLabels : [body.sizeLabels];
    const prices = Array.isArray(body.sizePrices) ? body.sizePrices : [body.sizePrices];

    return labels
      .map((label, idx) => ({
        label: (label ?? "").toString().trim(),
        price: Number(prices[idx]),
      }))
      .filter((s) => s.label && !Number.isNaN(s.price) && s.price >= 0);
  }

  // Caso 3
  const v1Label = (body.v1_label ?? "").toString().trim();
  const v1Price = Number(body.v1_price);
  const v2Label = (body.v2_label ?? "").toString().trim();
  const v2Price = Number(body.v2_price);

  const sizes = [];
  if (v1Label && !Number.isNaN(v1Price) && v1Price >= 0) sizes.push({ label: v1Label, price: v1Price });
  if (v2Label && !Number.isNaN(v2Price) && v2Price >= 0) sizes.push({ label: v2Label, price: v2Price });

  return sizes;
}

/* =====================================================
   DASHBOARD (compatible con tu Order.js)
===================================================== */
exports.dashboard = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const allowedStatuses = ["nuevo", "en_proceso", "listo", "entregado", "cancelado"];

    // 1) Pedidos por estado
    const ordersByStatusAgg = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);

    const ordersByStatus = (ordersByStatusAgg || [])
      .filter((x) => allowedStatuses.includes(x.status))
      .sort((a, b) => allowedStatuses.indexOf(a.status) - allowedStatuses.indexOf(b.status));

    const totalOrders = ordersByStatus.reduce((acc, s) => acc + (s.count || 0), 0);
    const newOrdersCount = ordersByStatus.find((s) => s.status === "nuevo")?.count || 0;

    // 2) Pedidos hoy
    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    // 3) Ventas de hoy (tu Order ya tiene total ✅)
    const todaySalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$total" } } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    const todaySales = Number(todaySalesAgg?.[0]?.total ?? 0);

    // 4) Top productos (tu OrderItem usa unitPrice ✅)
    const topAgg = await Order.aggregate([
      { $match: { items: { $exists: true, $ne: [] } } },
      { $unwind: "$items" },
      {
        $project: {
          productId: "$items.productId",
          name: "$items.name",
          qty: { $toDouble: { $ifNull: ["$items.qty", 0] } },
          revenue: {
            $multiply: [
              { $toDouble: { $ifNull: ["$items.qty", 0] } },
              { $toDouble: { $ifNull: ["$items.unitPrice", 0] } }, // ✅ unitPrice
            ],
          },
          imageUrl: { $ifNull: ["$items.imageUrl", ""] }, // ✅ por si lo quieres usar
        },
      },
      {
        $group: {
          _id: "$productId",
          name: { $first: "$name" },
          qtySold: { $sum: "$qty" },
          revenue: { $sum: "$revenue" },
          itemImageUrl: { $first: "$imageUrl" },
        },
      },
      { $sort: { qtySold: -1 } },
      { $limit: 5 },
      // Traer datos del producto (imagen/categoría)
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "prod",
        },
      },
      { $addFields: { prod: { $arrayElemAt: ["$prod", 0] } } },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          qtySold: 1,
          revenue: 1,
          // Si existe imagen del producto, úsala; si no, usa la del item
          image: {
            $cond: [
              { $and: [{ $ne: ["$prod.image", null] }, { $ne: ["$prod.image", ""] }] },
              "$prod.image",
              "$itemImageUrl",
            ],
          },
          category: "$prod.category",
        },
      },
    ]);

    const topProducts = (topAgg || []).map((p) => ({
      ...p,
      qtySold: Number(p.qtySold || 0),
      revenue: Number(p.revenue || 0),
    }));

    const cards = {
      newOrdersCount,
      todaySales,
      todayOrdersCount,
      totalOrders,
    };

    return res.render("admin/dashboard", {
      title: "Dashboard - CalentanaCo",
      currentUser: req.session.user || null,
      cards,
      topProducts,
      ordersByStatus,
      error: null,
    });
  } catch (e) {
    console.error("dashboard error:", e);
    return res.render("admin/dashboard", {
      title: "Dashboard - CalentanaCo",
      currentUser: req.session.user || null,
      cards: { newOrdersCount: 0, todaySales: 0, todayOrdersCount: 0, totalOrders: 0 },
      topProducts: [],
      ordersByStatus: [],
      error: "❌ No se pudo cargar el dashboard.",
    });
  }
};

/* =====================================================
   COMPANY
===================================================== */
exports.getCompany = async (req, res) => {
  const info = (await CompanyInfo.findOne()) || null;

  res.render("admin/company", {
    title: "Empresa - CalentanaCo",
    info,
    success: null,
    error: null,
  });
};

exports.postCompany = async (req, res) => {
  try {
    const { mission, vision, slogan } = req.body;

    const payload = {
      mission: (mission || "").trim(),
      vision: (vision || "").trim(),
      slogan: (slogan || "").trim(),
    };

    const existing = await CompanyInfo.findOne();
    if (existing) {
      existing.mission = payload.mission;
      existing.vision = payload.vision;
      existing.slogan = payload.slogan;
      await existing.save();
    } else {
      await CompanyInfo.create(payload);
    }

    const info = await CompanyInfo.findOne();

    return res.render("admin/company", {
      title: "Empresa - CalentanaCo",
      info,
      success: "✅ Información actualizada correctamente.",
      error: null,
    });
  } catch (e) {
    console.error("postCompany error:", e);

    const info = (await CompanyInfo.findOne()) || null;
    return res.render("admin/company", {
      title: "Empresa - CalentanaCo",
      info,
      success: null,
      error: "❌ No se pudo guardar la información de la empresa.",
    });
  }
};

/* =====================================================
   PRODUCTS - LIST
===================================================== */
exports.productsList = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.render("admin/products", {
      title: "Productos - CalentanaCo",
      products,
      success: null,
      error: null,
    });
  } catch (e) {
    console.error("productsList error:", e);
    res.render("admin/products", {
      title: "Productos - CalentanaCo",
      products: [],
      success: null,
      error: "❌ Error al cargar productos.",
    });
  }
};

/* =====================================================
   PRODUCTS - NEW (FORM)
===================================================== */
exports.productsNewGet = async (req, res) => {
  res.render("admin/product-new", {
    title: "Agregar producto - CalentanaCo",
    error: null,
    values: {
      name: "",
      description: "",
      category: "aguas",
      sizes: [
        { label: "1/2 Litro", price: 25 },
        { label: "1 Litro", price: 35 },
      ],
    },
  });
};

/* =====================================================
   PRODUCTS - NEW (CREATE)
===================================================== */
exports.productsNewPost = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const values = { ...req.body };

    if (!name || !category) {
      return res.render("admin/product-new", {
        title: "Agregar producto - CalentanaCo",
        error: "❌ Nombre y categoría son obligatorios.",
        values,
      });
    }

    const sizes = normalizeSizes(req.body);

    if (category === "aguas" && sizes.length === 0) {
      return res.render("admin/product-new", {
        title: "Agregar producto - CalentanaCo",
        error: "❌ Las aguas deben tener tamaños con precio (por ejemplo 1/2 L y 1 L).",
        values,
      });
    }

    let image = "";
    if (req.file) image = req.file.filename;

    await Product.create({
      name: name.trim(),
      description: (description || "").trim(),
      category,
      sizes,
      image,
      isActive: true,
    });

    return res.redirect("/admin/products");
  } catch (e) {
    console.error("productsNewPost error:", e);

    return res.render("admin/product-new", {
      title: "Agregar producto - CalentanaCo",
      error: "❌ Ocurrió un error al guardar el producto.",
      values: req.body,
    });
  }
};

/* =====================================================
   PRODUCTS - EDIT (GET)
===================================================== */
exports.productsEditGet = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/admin/products");

    return res.render("admin/product-edit", {
      title: "Editar producto - CalentanaCo",
      error: null,
      product,
    });
  } catch (e) {
    console.error("productsEditGet error:", e);
    return res.redirect("/admin/products");
  }
};

/* =====================================================
   PRODUCTS - EDIT (POST)
===================================================== */
exports.productsEditPost = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/admin/products");

    const { name, description, category } = req.body;

    if (!name || !category) {
      return res.render("admin/product-edit", {
        title: "Editar producto - CalentanaCo",
        error: "❌ Nombre y categoría son obligatorios.",
        product,
      });
    }

    const sizes = normalizeSizes(req.body);

    if (category === "aguas" && sizes.length === 0) {
      return res.render("admin/product-edit", {
        title: "Editar producto - CalentanaCo",
        error: "❌ Las aguas deben tener tamaños con precio.",
        product,
      });
    }

    product.name = name.trim();
    product.description = (description || "").trim();
    product.category = category;
    product.sizes = sizes;

    if (req.file) product.image = req.file.filename;

    await product.save();
    return res.redirect("/admin/products");
  } catch (e) {
    console.error("productsEditPost error:", e);
    return res.redirect("/admin/products");
  }
};

/* =====================================================
   PRODUCTS - TOGGLE ACTIVE
===================================================== */
exports.productsTogglePost = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/admin/products");

    product.isActive = !product.isActive;
    await product.save();

    return res.redirect("/admin/products");
  } catch (e) {
    console.error("productsTogglePost error:", e);
    return res.redirect("/admin/products");
  }
};

/* =====================================================
   PRODUCTS - DELETE
===================================================== */
exports.productsDeletePost = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.redirect("/admin/products");
  } catch (e) {
    console.error("productsDeletePost error:", e);
    return res.redirect("/admin/products");
  }
};

/* =====================================================
   ORDERS
===================================================== */
exports.ordersList = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.render("admin/orders", {
      title: "Pedidos - CalentanaCo",
      orders,
      success: null,
      error: null,
      currentUser: req.session.user || null,
    });
  } catch (e) {
    console.error("ordersList error:", e);
    return res.render("admin/orders", {
      title: "Pedidos - CalentanaCo",
      orders: [],
      success: null,
      error: "❌ Error al cargar pedidos.",
      currentUser: req.session.user || null,
    });
  }
};

exports.orderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.redirect("/admin/orders");

    return res.render("admin/order-detail", {
      title: "Detalle de pedido - CalentanaCo",
      order,
      success: null,
      error: null,
      currentUser: req.session.user || null,
    });
  } catch (e) {
    console.error("orderDetail error:", e);
    return res.redirect("/admin/orders");
  }
};

exports.orderStatusPost = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["nuevo", "en_proceso", "listo", "entregado", "cancelado"];
    if (!allowed.includes(status)) return res.redirect(`/admin/orders/${req.params.id}`);

    await Order.findByIdAndUpdate(req.params.id, { status });
    return res.redirect(`/admin/orders/${req.params.id}`);
  } catch (e) {
    console.error("orderStatusPost error:", e);
    return res.redirect(`/admin/orders/${req.params.id}`);
  }
};
