// models/Product.js
const mongoose = require("mongoose");

const SizeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, required: true, trim: true }, // aguas | botanas | antojitos

    // ✅ tamaños y precios (aguas)
    sizes: { type: [SizeSchema], default: [] },

    // ✅ imagen (filename y url)
    image: { type: String, default: "" },
    imageUrl: { type: String, default: "" },

    // ✅ activar/desactivar
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
