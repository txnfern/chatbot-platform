// ============================================================
//  routes/index.js — รวม route ทั้งหมด
// ============================================================

const express     = require("express");
const router      = express.Router();
const authMw      = require("../middleware/auth.middleware");
const authSvc     = require("../services/auth.service");
const walletSvc   = require("../services/wallet.service");
const walletRepo  = require("../repositories/wallet.repository");
const chatSvc     = require("../services/chat.service");
const paymentSvc  = require("../services/payment.service");

// ── AUTH ──────────────────────────────────────────────────────

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: "missing fields" });

    const result = await authSvc.register(email, password, name);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "missing fields" });

    const result = await authSvc.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// ── WALLET (ต้องล็อกอิน) ─────────────────────────────────────

// GET /wallet — ดูยอด coin
router.get("/wallet", authMw, async (req, res) => {
  try {
    const balance = await walletSvc.getBalance(req.userId);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /wallet/history — ประวัติ transaction
router.get("/wallet/history", authMw, async (req, res) => {
  try {
    const txs = await walletRepo.getUserTransactions(req.userId);
    res.json({ transactions: txs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PAYMENT (ต้องล็อกอิน) ────────────────────────────────────

// POST /payment/create — เริ่ม payment session
router.post("/payment/create", authMw, async (req, res) => {
  try {
    const { price, method } = req.body; // price = 15 | 39 | 79 | ...
    if (!price || !method)
      return res.status(400).json({ error: "missing price or method" });

    const session = await paymentSvc.createPayment(req.userId, price, method);
    res.json({ success: true, ...session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /payment/success — gateway callback (หรือ mock กดปุ่ม demo)
router.post("/payment/success", async (req, res) => {
  try {
    const { ref } = req.body;
    if (!ref) return res.status(400).json({ error: "missing ref" });

    // production: ตรวจ HMAC signature จาก gateway ที่นี่

    const result = await paymentSvc.handleSuccess(ref);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /payment/failure — gateway แจ้งล้มเหลว
router.post("/payment/failure", async (req, res) => {
  try {
    const { ref } = req.body;
    if (ref) await paymentSvc.handleFailure(ref);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── CHAT (ต้องล็อกอิน) ───────────────────────────────────────

// POST /chat
router.post("/chat", authMw, async (req, res) => {
  try {
    const { message, bot, isPaid } = req.body;
    if (!message || !bot)
      return res.status(400).json({ error: "missing message or bot" });

    const result = await chatSvc.sendMessage({
      userId: req.userId,
      message,
      bot,
      isPaid: !!isPaid,
    });
    res.json(result);
  } catch (err) {
    const status = err.message === "coin not enough" ? 402 : 500;
    res.status(status).json({ error: err.message });
  }
});

// GET /bots — รายชื่อบอท (public)
router.get("/bots", (req, res) => {
  res.json(chatSvc.getBotList());
});

module.exports = router;