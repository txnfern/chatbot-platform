// ============================================================
//  services/chat.service.js
//  รับข้อความ → เช็ค coin → เรียก Claude → บันทึก DB
// ============================================================

const walletSvc  = require("./wallet.service");
const chatRepo   = require("../repositories/chat.repository");

const BOT_PERSONAS = {
  luna:  { name: "ลูน่า",  systemPrompt: `คุณคือ ลูน่า เพื่อนที่อ่อนโยน อบอุ่น ใจดี ตอบเป็นภาษาไทย สั้นๆ ไม่เกิน 3 ประโยค` },
  kai:   { name: "ไค",    systemPrompt: `คุณคือ ไค โค้ชส่วนตัว กระตุ้น ตรงไปตรงมา มีพลัง ตอบเป็นภาษาไทย สั้นๆ ไม่เกิน 3 ประโยค` },
  nova:  { name: "โนวา",  systemPrompt: `คุณคือ โนวา นักวิทยาศาสตร์ ฉลาด ละเอียด ชอบอธิบาย ตอบเป็นภาษาไทย สั้นๆ ไม่เกิน 3 ประโยค` },
  rex:   { name: "เร็กซ์", systemPrompt: `คุณคือ เร็กซ์ ตลก กวน แซวแต่ดูแลใจ ตอบเป็นภาษาไทย สั้นๆ ไม่เกิน 3 ประโยค` },
  mochi: { name: "โมจิ",  systemPrompt: `คุณคือ โมจิ น่ารักมาก ใช้ emoji เยอะ ร่าเริง ตอบเป็นภาษาไทย สั้นๆ ไม่เกิน 3 ประโยค` },
  zen:   { name: "เซ็น",  systemPrompt: `คุณคือ เซ็น สงบ ลึกซึ้ง ปรัชญา ตั้งคำถามกลับ ตอบเป็นภาษาไทย สั้นๆ ไม่เกิน 3 ประโยค` },
};

// ── SEND MESSAGE ─────────────────────────────────────────────
exports.sendMessage = async ({ userId, message, bot, isPaid = false }) => {
  if (!userId || !message || !bot) throw new Error("missing fields");

  const persona = BOT_PERSONAS[bot];
  if (!persona) throw new Error("unknown bot");

  // หัก coin เฉพาะช่วงจ่ายเงิน
  if (isPaid) {
    await walletSvc.spendCoin(userId, 1, `chat with ${bot}`);
  }

  // ดึง history 10 รอบล่าสุดให้บอทจำบริบท
  const history = await chatRepo.getChatHistory(userId, bot, 10);

  // เรียก Claude API
  let reply;
  try {
    reply = await callClaude(persona.systemPrompt, message, history);
  } catch (err) {
    // คืน coin ถ้า API พัง
    if (isPaid) await walletSvc.refundCoin(userId, 1, "api error refund");
    throw err;
  }

  // บันทึก chat ลง DB
  await chatRepo.saveChat(userId, bot, message, reply);

  return { reply };
};

// ── BOT LIST ─────────────────────────────────────────────────
exports.getBotList = () =>
  Object.entries(BOT_PERSONAS).map(([id, p]) => ({ id, name: p.name }));

// ── CLAUDE API ───────────────────────────────────────────────
async function callClaude(systemPrompt, message, history = []) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":    "application/json",
      "x-api-key":       process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system:     systemPrompt,
      messages:   [...history, { role: "user", content: message }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "ขอโทษนะ ลองพิมพ์ใหม่ได้เลย";
}