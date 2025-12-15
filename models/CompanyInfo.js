// models/CompanyInfo.js
const mongoose = require("mongoose");

const CompanyInfoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "CalentanaCo",
    },
    mission: {
      type: String,
      default:
        "Llevar a cada persona el auténtico sabor calentano a través de aguas frescas, botanas y antojitos elaborados con calidad, tradición y cariño; ofreciendo una experiencia cercana, rápida y accesible para todos.",
    },
    vision: {
      type: String,
      default:
        "Convertirnos en la marca líder de aguas frescas y botanas en la región, reconocida por su sabor incomparable, su servicio humano y cercano, y por la innovación constante en la experiencia del cliente tanto en tienda como en plataformas digitales.",
    },
    slogan: {
      type: String,
      default: "El sabor que te abraza, la frescura que te inspira.",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CompanyInfo", CompanyInfoSchema);
