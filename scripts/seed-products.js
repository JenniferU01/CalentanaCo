// scripts/seed-products.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function run() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ Falta MONGODB_URI");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅ Conectado a MongoDB Atlas");

  // Limpiar productos anteriores
  await Product.deleteMany({});
  console.log("🧹 Productos anteriores eliminados");

  const products = [
    {
      name: "Agua de Avena",
      description: "Agua fresca de avena.",
      category: "aguas",
      sizes: [
        { label: "1 L", price: 35 },
        { label: "1/2 L", price: 25 }
      ],
      image: "agua-avena-1765792629574.jpg",
      imageUrl: "/img/products/agua-avena-1765792629574.jpg",
      isActive: true
    },
    {
      name: "Agua de Café",
      description: "Agua fresca de café.",
      category: "aguas",
      sizes: [
        { label: "1 L", price: 35 },
        { label: "1/2 L", price: 25 }
      ],
      image: "agua-cafe-1765791370322.jpg",
      imageUrl: "/img/products/agua-cafe-1765791370322.jpg",
      isActive: true
    },
    {
      name: "Agua de Cítricos",
      description: "Agua fresca de cítricos.",
      category: "aguas",
      sizes: [
        { label: "1 L", price: 35 },
        { label: "1/2 L", price: 25 }
      ],
      image: "agua-de-citricos-1765796647761.jpg",
      imageUrl: "/img/products/agua-de-citricos-1765796647761.jpg",
      isActive: true
    },
    {
      name: "Agua de Coco",
      description: "Agua fresca de coco.",
      category: "aguas",
      sizes: [
        { label: "1 L", price: 35 },
        { label: "1/2 L", price: 25 }
      ],
      image: "agua-de-coco-1765796667812.jpg",
      imageUrl: "/img/products/agua-de-coco-1765796667812.jpg",
      isActive: true
    },
    {
      name: "Agua de Fresa",
      description: "Agua fresca de fresa.",
      category: "aguas",
      sizes: [
        { label: "1 L", price: 35 },
        { label: "1/2 L", price: 25 }
      ],
      image: "agua-de-fresa-1765796688277.jpg",
      imageUrl: "/img/products/agua-de-fresa-1765796688277.jpg",
      isActive: true
    },
    {
      name: "Agua de Frutas",
      description: "Agua fresca de frutas naturales.",
      category: "aguas",
      sizes: [
        { label: "1 L", price: 35 },
        { label: "1/2 L", price: 25 }
      ],
      image: "agua-de-frutas-1765796711114.jpg",
      imageUrl: "/img/products/agua-de-frutas-1765796711114.jpg",
      isActive: true
    }
  ];

  const inserted = await Product.insertMany(products);
  console.log(`✅ Insertados ${inserted.length} productos`);

  await mongoose.disconnect();
  console.log("✅ Seed terminado correctamente");
  process.exit(0);
}

run().catch(async (err) => {
  console.error("❌ Error en seed:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
