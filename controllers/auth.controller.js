// controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// GET /login
function showLogin(req, res) {
  res.render("auth/login", { title: "Iniciar sesión - CalentanaCo", error: null });
}

// POST /login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("auth/login", {
        title: "Iniciar sesión - CalentanaCo",
        error: "Correo y contraseña son obligatorios.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.render("auth/login", {
        title: "Iniciar sesión - CalentanaCo",
        error: "Credenciales incorrectas.",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.render("auth/login", {
        title: "Iniciar sesión - CalentanaCo",
        error: "Credenciales incorrectas.",
      });
    }

    // ✅ Guardar lo necesario en sesión (incluye role)
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // ✅ Si es admin, al dashboard. Si es cliente, al home.
    if (user.role === "admin") return res.redirect("/admin/dashboard");
    return res.redirect("/");
  } catch (error) {
    console.error("login error:", error);
    return res.render("auth/login", {
      title: "Iniciar sesión - CalentanaCo",
      error: "Ocurrió un error al iniciar sesión.",
    });
  }
}

// GET /register
function showRegister(req, res) {
  res.render("auth/register", { title: "Crear cuenta - CalentanaCo", error: null });
}

// POST /register (cliente por defecto)
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.render("auth/register", {
        title: "Crear cuenta - CalentanaCo",
        error: "Nombre, correo y contraseña son obligatorios.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.render("auth/register", {
        title: "Crear cuenta - CalentanaCo",
        error: "Ese correo ya está registrado.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "client",
    });

    return res.redirect("/login");
  } catch (error) {
    console.error("register error:", error);
    return res.render("auth/register", {
      title: "Crear cuenta - CalentanaCo",
      error: "Ocurrió un error al registrar.",
    });
  }
}

// GET /logout
function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/");
  });
}

module.exports = {
  showLogin,
  login,
  showRegister,
  register,
  logout,
};
