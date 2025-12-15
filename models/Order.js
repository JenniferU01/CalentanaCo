// models/Order.js
const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sizeLabel: { type: String, default: "Único" },
    unitPrice: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    // Datos del cliente (público)
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },

    // Entrega
    deliveryMethod: {
      type: String,
      enum: ["domicilio", "recoger"],
      required: true,
      default: "domicilio",
    },
    addressText: { type: String, default: "" }, // dirección / referencias
    mapsUrl: { type: String, default: "" },     // link de Google Maps opcional
    etaMinutes: { type: Number, default: 30, min: 1 }, // tiempo estimado

    // Pago
    paymentMethod: {
      type: String,
      enum: ["efectivo", "transferencia"],
      required: true,
      default: "efectivo",
    },
    cashAmount: { type: Number, default: 0, min: 0 }, // si paga en efectivo y quiere cambio

    // Pedido
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },

    // Estado
    status: {
      type: String,
      enum: ["nuevo", "en_proceso", "listo", "entregado", "cancelado"],
      default: "nuevo",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
