// controllers/admin.products.controller.js

export function renderNewProduct(req, res) {
  return res.render("admin/products/new", {
    title: "Nuevo producto",
    error: null,
    form: {},
  });
}

export async function createProduct(req, res) {
  try {
    const { name, price, description } = req.body;

    // ✅ URL pública de la imagen
    const imageUrl = req.file ? `/img/products/${req.file.filename}` : "";

    const product = {
      name: (name || "").trim(),
      price: Number(price || 0),
      description: (description || "").trim(),
      image: imageUrl,
      createdAt: new Date(),
    };

    // Aquí iría tu guardado real en Mongo, por ejemplo:
    // await Product.create(product);

    console.log("✅ Producto guardado:", product);

    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("❌ Error al guardar producto:", err);

    return res.status(500).render("admin/products/new", {
      title: "Nuevo producto",
      error: err.message || "Error al guardar el producto",
      form: req.body,
    });
  }
}
