// ============================================================
//  services/payment.service.js
//  Mock Payment Gateway — สลับเป็น PromptPay / TrueMoney จริงได้
// ============================================================

const crypto     = require("crypto");
const walletSvc  = require("./wallet.service");
const walletRepo = require("../repositories/wallet.repository");

// แพ็กเกจที่ขาย (ตรงกับ index.html)
const PACKAGES = {
  "15":  { coins: 50,   bonus: 0,   label: "50 เหรียญ" },
  "39":  { coins: 150,  bonus: 20,  label: "150 เหรียญ (+20 โบนัส)" },
  "79":  { coins: 350,  bonus: 50,  label: "350 เหรียญ (+50 โบนัส)" },
  "139": { coins: 700,  bonus: 120, label: "700 เหรียญ (+120 โบนัส)" },
  "269": { coins: 1500, bonus: 300, label: "1500 เหรียญ (+300 โบนัส)" },
  "499": { coins: 3000, bonus: 700, label: "3000 เหรียญ (+700 โบนัส)" },
};

// ── CREATE PAYMENT ───────────────────────────────────────────
/**
 * สร้าง payment session (pending)
 * production: เรียก PromptPay / TrueMoney API แล้วได้ QR กลับมา
 */
exports.createPayment = async (userId, priceThb, method) => {
  const pkg = PACKAGES[String(priceThb)];
  if (!pkg) throw new Error("invalid package");

  // สร้าง reference เฉพาะของ session นี้
  const ref = "AICAFE-" + crypto.randomBytes(6).toString("hex").toUpperCase();

  // บันทึก transaction สถานะ pending ก่อน (สำคัญมาก)
  await walletRepo.createPendingTransaction(
    userId,
    pkg.coins + pkg.bonus,
    ref,
    pkg.label
  );

  // Mock: สร้าง QR URL จำลอง
  // production: แทนที่ด้วย API จริง เช่น
  //   PromptPay: POST https://api.gbprimepay.com/gbp/qrcode
  //   TrueMoney: POST https://api.truemoney.com/payment/create
  const mockQrUrl = method === "wallet"
    ? `https://qr.truemoney.com/mock?ref=${ref}&amount=${priceThb}`
    : `https://promptpay.io/0812345678/${priceThb}.png`;

  return {
    ref,
    qrUrl:   mockQrUrl,
    amount:  priceThb,
    coins:   pkg.coins + pkg.bonus,
    label:   pkg.label,
    method,
  };
};

// ── HANDLE SUCCESS (callback) ────────────────────────────────
/**
 * เรียกเมื่อ payment gateway ยืนยันว่าจ่ายแล้ว
 * production: route นี้ควรตรวจ signature/HMAC จาก gateway ด้วย
 */
exports.handleSuccess = async (ref) => {
  // เช็คว่า ref มีอยู่จริง และยังเป็น pending
  const tx = await walletRepo.getTransactionByRef(ref);
  if (!tx)                    throw new Error("transaction not found");
  if (tx.status === "success") throw new Error("already processed");  // กัน double-credit
  if (tx.status === "failed")  throw new Error("transaction failed");

  // เพิ่ม coin (adjustBalance จะ log ซ้ำ → ใช้ markSuccess แทน)
  await walletSvc.addCoin(tx.user_id, tx.amount, ref + "-CREDIT", tx.note);
  await walletRepo.markTransactionSuccess(ref);

  return { userId: tx.user_id, coins: tx.amount };
};

// ── HANDLE FAILURE ───────────────────────────────────────────
exports.handleFailure = async (ref) => {
  const tx = await walletRepo.getTransactionByRef(ref);
  if (!tx) throw new Error("transaction not found");
  if (tx.status !== "pending") return; // ไม่ทำอะไรถ้าไม่ใช่ pending
  await walletRepo.markTransactionFailed(ref);
};