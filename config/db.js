// config/db.js
const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/CalentanaCoDB";

    await mongoose.connect(uri);

    console.log("✅ Conexión exitosa a MongoDB");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
