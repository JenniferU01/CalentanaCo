require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const shopRoutes = require("./routes/shop.routes");

// ✅ NUEVO: Dashboard routes
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

/* =========================
   DB
========================= */
connectDB();

/* =========================
   MIDDLEWARES
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "calentanaco_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

/* =========================
   VIEWS
========================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================
   STATIC FILES
========================= */
app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/img", express.static(path.join(__dirname, "public", "img")));

// ✅ NUEVO: si quieres servir dashboard.html desde public/
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   ROUTES
========================= */
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/", shopRoutes);

// ✅ NUEVO: Dashboard API
app.use("/api/dashboard", dashboardRoutes);

/* =========================
   HOME (fallback)
========================= */
app.get("/", (req, res) => {
  return res.render("home", { title: "CalentanaCo" });
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor CalentanaCo escuchando en http://localhost:${PORT}`);
});
