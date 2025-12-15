// controllers/shop.controller.js
const Product = require("../models/Product");
const Order = require("../models/Order");

function ensureCart(req) {
  if (!req.session.cart) {
    req.session.cart = { items: [] };
  }
}

function calcCart(cart) {
  let total = 0;
  for (const item of cart.items) total += item.unitPrice * item.qty;
  return total;
}

function cartCount(cart) {
  if (!cart || !Array.isArray(cart.items)) return 0;
  return cart.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
}

function buildWhatsAppText(order) {
  const lines = [];

  lines.push("Hola, quiero hacer el siguiente pedido:");
  lines.push("");

  for (const it of order.items) {
    const subtotal = (Number(it.unitPrice) * Number(it.qty)).toFixed(2);
    lines.push(`• ${it.name} (${it.sizeLabel || "Único"}) x${it.qty} - $${subtotal}`);
  }

  lines.push("");
  lines.push(`Total: $${Number(order.total).toFixed(2)}`);
  lines.push("");

  // Entrega
  lines.push(`Entrega: ${order.deliveryMethod === "domicilio" ? "A domicilio" : "Recoger en tienda"}`);
  if (order.deliveryMethod === "domicilio") {
    if (order.addressText) lines.push(`Dirección/Referencias: ${order.addressText}`);
    if (order.mapsUrl) lines.push(`Ubicación (Maps): ${order.mapsUrl}`);
  }
  lines.push(`Tiempo estimado: ${order.etaMinutes} min`);
  lines.push("");

  // Pago
  lines.push(`Pago: ${order.paymentMethod === "efectivo" ? "Efectivo" : "Transferencia"}`);
  if (order.paymentMethod === "efectivo" && order.cashAmount > 0) {
    lines.push(`Traigo para: $${Number(order.cashAmount).toFixed(2)} (si necesitas dar cambio)`);
  }

  // Datos cliente
  if (order.customerName) lines.push(`Nombre: ${order.customerName}`);
  if (order.customerPhone) lines.push(`Teléfono: ${order.customerPhone}`);

  return lines.join("\n");
}

// =======================
// HOME -> redirige a menú
// =======================
async function home(req, res) {
  return res.redirect("/menu");
}

// =======================
// MENÚ
// =======================
async function menu(req, res) {
  const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });

  const grouped = { aguas: [], botanas: [], antojitos: [], otros: [] };

  for (const p of products) {
    const cat = p.category || "otros";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  ensureCart(req);

  return res.render("shop/menu", {
    title: "Menú - CalentanaCo",
    grouped,
    cartCount: cartCount(req.session.cart),
  });
}

// =======================
// CARRITO
// =======================
async function cart(req, res) {
  ensureCart(req);
  const total = calcCart(req.session.cart);

  return res.render("shop/cart", {
    title: "Carrito - CalentanaCo",
    cart: req.session.cart,
    total,
    whatsappPhone: process.env.WHATSAPP_PHONE || "",
    error: null,
  });
}

// =======================
// AGREGAR AL CARRITO
// =======================
async function addToCart(req, res) {
  try {
    ensureCart(req);

    const { productId, sizeLabel } = req.body;
    if (!productId) return res.redirect("/menu");

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.redirect("/menu");

    let chosenLabel = "";
    let unitPrice = 0;

    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      const found = product.sizes.find((s) => s.label === sizeLabel) || product.sizes[0];
      chosenLabel = found.label;
      unitPrice = Number(found.price) || 0;
    } else {
      chosenLabel = "Único";
      unitPrice = Number(product.price) || 0;
    }

    const key = `${product._id.toString()}__${chosenLabel}`;

    const existing = req.session.cart.items.find((i) => i.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      let imageUrl = "";
      if (product.imageUrl && String(product.imageUrl).trim() !== "") {
        imageUrl = product.imageUrl;
      } else if (product.image && String(product.image).trim() !== "") {
        imageUrl = "/img/products/" + product.image;
      }

      req.session.cart.items.push({
        key,
        productId: product._id.toString(),
        name: product.name,
        imageUrl,
        sizeLabel: chosenLabel,
        unitPrice,
        qty: 1,
      });
    }

    return res.redirect("/cart");
  } catch (e) {
    console.error("addToCart error:", e);
    return res.redirect("/menu");
  }
}

// =======================
// QUITAR DEL CARRITO
// =======================
async function removeFromCart(req, res) {
  ensureCart(req);
  const { key } = req.body;
  if (!key) return res.redirect("/cart");

  req.session.cart.items = req.session.cart.items.filter((i) => i.key !== key);
  return res.redirect("/cart");
}

// =======================
// VACIAR CARRITO
// =======================
async function clearCart(req, res) {
  req.session.cart = { items: [] };
  return res.redirect("/cart");
}

// =======================
// CHECKOUT (GUARDA EN BD + REDIRIGE A WHATSAPP)
// =======================
async function checkoutPost(req, res) {
  try {
    ensureCart(req);

    if (!req.session.cart.items || req.session.cart.items.length === 0) {
      return res.redirect("/cart");
    }

    const whatsappPhone = process.env.WHATSAPP_PHONE || "";
    if (!whatsappPhone) {
      const total = calcCart(req.session.cart);
      return res.render("shop/cart", {
        title: "Carrito - CalentanaCo",
        cart: req.session.cart,
        total,
        whatsappPhone: "",
        error: "❌ Aún no está configurado el número de WhatsApp del negocio.",
      });
    }

    // Datos del formulario
    const customerName = (req.body.customerName || "").trim();
    const customerPhone = (req.body.customerPhone || "").trim();

    const deliveryMethod = (req.body.deliveryMethod || "domicilio").trim(); // domicilio|recoger
    const addressText = (req.body.addressText || "").trim();
    const mapsUrl = (req.body.mapsUrl || "").trim();

    const etaMinutes = Number(req.body.etaMinutes) || 30;

    const paymentMethod = (req.body.paymentMethod || "efectivo").trim(); // efectivo|transferencia
    const cashAmount = Number(req.body.cashAmount) || 0;

    // Validaciones mínimas
    if (deliveryMethod === "domicilio" && !addressText && !mapsUrl) {
      const total = calcCart(req.session.cart);
      return res.render("shop/cart", {
        title: "Carrito - CalentanaCo",
        cart: req.session.cart,
        total,
        whatsappPhone,
        error: "❌ Para entrega a domicilio agrega dirección/referencias o un link de Google Maps.",
      });
    }

    const total = calcCart(req.session.cart);

    // Crear orden en BD
    const order = await Order.create({
      customerName,
      customerPhone,
      deliveryMethod,
      addressText,
      mapsUrl,
      etaMinutes,
      paymentMethod,
      cashAmount: paymentMethod === "efectivo" ? cashAmount : 0,
      items: req.session.cart.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        sizeLabel: i.sizeLabel || "Único",
        unitPrice: Number(i.unitPrice) || 0,
        qty: Number(i.qty) || 1,
        imageUrl: i.imageUrl || "",
      })),
      total,
      status: "nuevo",
    });

    // Vaciar carrito
    req.session.cart = { items: [] };

    // Construir WhatsApp URL
    const text = buildWhatsAppText(order);
    const waUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`;

    // Redirigir a success con link wa
    return res.redirect(`/order/success?wa=${encodeURIComponent(waUrl)}&id=${order._id}`);
  } catch (e) {
    console.error("checkoutPost error:", e);
    return res.redirect("/cart");
  }
}

// =======================
// SUCCESS PAGE
// =======================
async function orderSuccessGet(req, res) {
  const wa = req.query.wa ? String(req.query.wa) : "";
  const id = req.query.id ? String(req.query.id) : "";

  return res.render("shop/success", {
    title: "Pedido creado - CalentanaCo",
    wa,
    id,
  });
}

module.exports = {
  home,
  menu,
  cart,
  addToCart,
  removeFromCart,
  clearCart,
  checkoutPost,
  orderSuccessGet,
};
