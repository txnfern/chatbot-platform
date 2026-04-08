// ============================================================
//  server.js — AICafe Entry Point
// ============================================================

require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const routes  = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve หน้าเว็บ
app.use(express.static(path.join(__dirname, "public")));

// API routes ทั้งหมด
app.use("/", routes);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: "not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AICafe server → http://localhost:${PORT}`);
});