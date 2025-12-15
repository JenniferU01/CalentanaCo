// controllers/dashboard.controller.js
const Order = require("../models/Order");

/* =========================
   HELPERS DE FECHA
========================= */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfYear = () => {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/* =========================
   PEDIDOS POR ESTADO
========================= */
exports.ordersByStatus = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: "$status", total: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", total: 1 } },
      { $sort: { total: -1 } },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error en ordersByStatus" });
  }
};

/* =========================
   VENTAS DÍA / MES / AÑO
========================= */
exports.sales = async (req, res) => {
  try {
    const group = req.query.group || "month";

    let fromDate;
    if (group === "day") fromDate = startOfToday();
    else if (group === "year") fromDate = startOfYear();
    else fromDate = startOfMonth();

    const matchStage = {
      createdAt: { $gte: fromDate },
      status: { $in: ["en_proceso", "listo", "entregado"] },
    };

    let groupStage;
    if (group === "day") {
      groupStage = {
        _id: { $hour: "$createdAt" },
        total: { $sum: "$total" },
        orders: { $sum: 1 },
      };
    } else if (group === "year") {
      groupStage = {
        _id: { $month: "$createdAt" },
        total: { $sum: "$total" },
        orders: { $sum: 1 },
      };
    } else {
      groupStage = {
        _id: { $dayOfMonth: "$createdAt" },
        total: { $sum: "$total" },
        orders: { $sum: 1 },
      };
    }

    const raw = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { _id: 1 } },
    ]);

    const months = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];

    const data = raw.map(r => {
      let label = r._id;
      if (group === "day") label = `${String(r._id).padStart(2, "0")}:00`;
      if (group === "year") label = months[r._id - 1];
      return { label, total: r.total, orders: r.orders };
    });

    res.json({ group, data });
  } catch (error) {
    res.status(500).json({ error: "Error en sales" });
  }
};

/* =========================
   BADGE PEDIDOS NUEVOS
========================= */
exports.countNew = async (req, res) => {
  try {
    const total = await Order.countDocuments({ status: "nuevo" });
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: "Error en countNew" });
  }
};
