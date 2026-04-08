// ============================================================
//  middleware/auth.middleware.js
//  ตรวจ JWT ก่อนเข้า route ที่ต้องล็อกอิน
// ============================================================

const authService = require("../services/auth.service");

module.exports = (req, res, next) => {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "unauthorized: no token" });
  }

  try {
    const payload = authService.verifyToken(token);
    req.userId   = payload.userId;   // ใช้ใน route ได้เลย
    req.userName = payload.name;
    next();
  } catch {
    return res.status(401).json({ error: "unauthorized: invalid token" });
  }
};