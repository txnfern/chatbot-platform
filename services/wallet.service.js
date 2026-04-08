// ============================================================
//  services/wallet.service.js
//  Logic เหรียญ — ใช้ repository เพื่อแตะ DB
// ============================================================

const walletRepo = require("../repositories/wallet.repository");

exports.getBalance = async (userId) => {
  return walletRepo.getBalance(userId);
};

exports.hasEnough = async (userId, required = 1) => {
  const balance = await walletRepo.getBalance(userId);
  return balance >= required;
};

// หัก coin (ใช้ตอนส่งข้อความในโหมดจ่ายเงิน)
exports.spendCoin = async (userId, amount = 1, note = "chat") => {
  const enough = await exports.hasEnough(userId, amount);
  if (!enough) throw new Error("coin not enough");
  return walletRepo.adjustBalance(userId, -amount, "spend", null, note);
};

// เพิ่ม coin (เรียกหลัง payment สำเร็จ)
exports.addCoin = async (userId, amount, ref, note) => {
  return walletRepo.adjustBalance(userId, +amount, "topup", ref, note);
};

// คืน coin (เรียกตอน API ล้มเหลว)
exports.refundCoin = async (userId, amount, note = "refund") => {
  return walletRepo.adjustBalance(userId, +amount, "refund", null, note);
};