// ============================================================
//  wallet.service.js — AICafe
//  จัดการ coin ของ user แต่ละคน
//  (ใช้ in-memory store — production ควรเปลี่ยนเป็น DB)
// ============================================================

// -------------------------------------------------------
// in-memory store
// key   = userId (string)
// value = { coin: number }
// -------------------------------------------------------
const users = {
  "1": { coin: 30 },   // demo user — เริ่มต้นมี 30 เหรียญ
};

// -------------------------------------------------------
// getOrCreate — สร้าง wallet ใหม่ถ้ายังไม่มี
// -------------------------------------------------------
function getOrCreate(userId) {
  if (!users[userId]) {
    users[userId] = { coin: 0 };
  }
  return users[userId];
}

// -------------------------------------------------------
// getBalance — ดูยอด coin ปัจจุบัน
// -------------------------------------------------------
exports.getBalance = (userId) => {
  return getOrCreate(userId).coin;
};

// -------------------------------------------------------
// hasEnough — เช็คว่า coin > 0 ไหม
// เปลี่ยน threshold ได้ตามราคาบอทแต่ละตัว
// -------------------------------------------------------
exports.hasEnough = (userId, required = 1) => {
  return getOrCreate(userId).coin >= required;
};

// -------------------------------------------------------
// useCoin — หัก coin 1 เหรียญต่อ 1 ข้อความ
// -------------------------------------------------------
exports.useCoin = (userId, amount = 1) => {
  const wallet = getOrCreate(userId);
  if (wallet.coin < amount) throw new Error("coin not enough");
  wallet.coin -= amount;
  return wallet.coin;
};

// -------------------------------------------------------
// refundCoin — คืน coin เมื่อ API ล้มเหลว
// -------------------------------------------------------
exports.refundCoin = (userId, amount = 1) => {
  const wallet = getOrCreate(userId);
  wallet.coin += amount;
  return wallet.coin;
};

// -------------------------------------------------------
// topUp — เติม coin
// -------------------------------------------------------
exports.topUp = (userId, amount) => {
  const wallet = getOrCreate(userId);
  wallet.coin += amount;
  console.log(`[wallet] user ${userId} topped up +${amount} → total ${wallet.coin}`);
  return wallet.coin;
};