// middlewares/auth.js

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).send("Acceso denegado: inicia sesión.");
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).send("Acceso denegado: se requiere rol de administrador.");
  }

  next();
}

module.exports = { requireAuth, requireAdmin };
