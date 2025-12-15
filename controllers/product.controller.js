// controllers/product.controller.js
const Product = require("../models/Product");

// Listar productos
async function listProducts(req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.render("admin/products", {
      title: "Productos - CalentanaCo",
      products,
      success: null,
      error: null,
    });
  } catch (error) {
    console.error("Error listProducts:", error);
    res.render("admin/products", {
      title: "Productos - CalentanaCo",
      products: [],
      success: null,
      error: "Error al cargar productos.",
    });
  }
}

// Mostrar formulario crear
async function showCreateProduct(req, res) {
  res.render("admin/product_new", {
    title: "Agregar producto - CalentanaCo",
    error: null,
    values: {
      name: "",
      description: "",
      category: "aguas",
      pricingMode: "variants",
      price: "",
      // tamaños por defecto para agua
      halfLabel: "Medio litro",
      halfSize: "500 ml",
      halfPrice: "",
      oneLabel: "Un litro",
      oneSize: "1 L",
      onePrice: "",
    },
  });
}

// Crear producto (con imagen opcional)
async function createProduct(req, res) {
  try {
    const {
      name,
      description,
      category,
      pricingMode,
      price,
      halfLabel,
      halfSize,
      halfPrice,
      oneLabel,
      oneSize,
      onePrice,
    } = req.body;

    const values = {
      name,
      description,
      category,
      pricingMode,
      price,
      halfLabel,
      halfSize,
      halfPrice,
      oneLabel,
      oneSize,
      onePrice,
    };

    if (!name || !category) {
      return res.render("admin/product_new", {
        title: "Agregar producto - CalentanaCo",
        error: "Nombre y categoría son obligatorios.",
        values,
      });
    }

    // Imagen (si se subió)
    let imageUrl = "";
    if (req.file) {
      imageUrl = `/img/products/${req.file.filename}`;
    }

    const mode = pricingMode === "variants" ? "variants" : "single";

    let productData = {
      name: name.trim(),
      description: (description || "").trim(),
      category,
      pricingMode: mode,
      imageUrl,
      isActive: true,
    };

    if (mode === "single") {
      if (price === undefined || price === "") {
        return res.render("admin/product_new", {
          title: "Agregar producto - CalentanaCo",
          error: "El precio es obligatorio.",
          values,
        });
      }

      const p = Number(price);
      if (Number.isNaN(p) || p < 0) {
        return res.render("admin/product_new", {
          title: "Agregar producto - CalentanaCo",
          error: "El precio debe ser un número válido (>= 0).",
          values,
        });
      }

      productData.price = p;
      productData.variants = [];
    } else {
      // Variantes: por ahora trabajamos con 2 tamaños (medio litro y 1 litro)
      const hp = Number(halfPrice);
      const op = Number(onePrice);

      if (
        !halfLabel || !halfSize || halfPrice === "" ||
        !oneLabel || !oneSize || onePrice === ""
      ) {
        return res.render("admin/product_new", {
          title: "Agregar producto - CalentanaCo",
          error: "Completa los 2 tamaños (etiqueta, tamaño y precio).",
          values,
        });
      }

      if (Number.isNaN(hp) || hp < 0 || Number.isNaN(op) || op < 0) {
        return res.render("admin/product_new", {
          title: "Agregar producto - CalentanaCo",
          error: "Los precios de tamaños deben ser números válidos (>= 0).",
          values,
        });
      }

      productData.price = 0;
      productData.variants = [
        { label: halfLabel.trim(), size: halfSize.trim(), price: hp },
        { label: oneLabel.trim(), size: oneSize.trim(), price: op },
      ];
    }

    await Product.create(productData);
    return res.redirect("/admin/products");
  } catch (error) {
    console.error("Error createProduct:", error);

    const msg =
      error?.message?.includes("Solo se permiten imágenes")
        ? error.message
        : "Ocurrió un error al guardar el producto.";

    return res.render("admin/product_new", {
      title: "Agregar producto - CalentanaCo",
      error: msg,
      values: req.body,
    });
  }
}

module.exports = {
  listProducts,
  showCreateProduct,
  createProduct,
};
