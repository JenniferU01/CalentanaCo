// routes/dashboard.routes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

// Dashboard
router.get("/orders-by-status", dashboardController.ordersByStatus);
router.get("/sales", dashboardController.sales);
router.get("/count-new", dashboardController.countNew);

module.exports = router;
