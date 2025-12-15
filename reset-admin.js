// reset-admin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/CalentanaCoDB";

  await mongoose.connect(uri);
  console.log("✅ Conectado a MongoDB");

  const email = "admin@calentanaco.com";
  const newPassword = "Admin1234"; // <-- puedes cambiarla si quieres

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await User.findOne({ email });

  if (!user) {
    // Si no existe, lo crea como admin
    await User.create({
      name: "Admin CalentanaCo",
      email,
      passwordHash,
      role: "admin",
    });
    console.log("✅ Admin creado:", email, "Password:", newPassword);
  } else {
    // Si existe, resetea password y rol
    user.passwordHash = passwordHash;
    user.role = "admin";
    await user.save();
    console.log("✅ Password actualizado para:", email, "Password:", newPassword);
  }

  await mongoose.disconnect();
  console.log("✅ Listo. Ya puedes iniciar sesión.");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
