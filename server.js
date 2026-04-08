// ============================================================
//  server.js — AICafe
//  รับ request จากเว็บ → ส่งต่อให้ service ต่างๆ จัดการ
// ============================================================

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const chatService   = require("./chat.service");
const walletService = require("./wallet.service");

const app = express();
app.use(cors());
app.use(express.json());

// Serve หน้า HTML โดยตรง
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------------------------------
// POST /chat
// Body: { userId, message, bot, history? }
// -------------------------------------------------------
app.post("/chat", async (req, res) => {
  const { userId, message, bot, history } = req.body;

  if (!userId || !message || !bot) {
    return res.status(400).json({ error: "missing required fields" });
  }

  const result = await chatService.sendMessage({ userId, message, bot, history });
  res.json(result);
});

// -------------------------------------------------------
// GET /wallet/:userId — ดูยอด coin
// -------------------------------------------------------
app.get("/wallet/:userId", (req, res) => {
  const balance = walletService.getBalance(req.params.userId);
  res.json({ userId: req.params.userId, coin: balance });
});

// -------------------------------------------------------
// POST /wallet/topup
// Body: { userId, amount }
// -------------------------------------------------------
app.post("/wallet/topup", (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: "invalid topup request" });
  }

  const newBalance = walletService.topUp(userId, amount);
  res.json({ success: true, coin: newBalance });
});

// -------------------------------------------------------
// GET /bots — รายชื่อบอทที่มี
// -------------------------------------------------------
app.get("/bots", (req, res) => {
  res.json(chatService.getBotList());
});

// -------------------------------------------------------
// Start
// -------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AICafe server running at http://localhost:${PORT}`);
});