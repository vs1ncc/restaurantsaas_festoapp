import crypto from "node:crypto";
import { getData, saveData, redis } from "../../lib/redis.js";

const TRIAL_HOURS = 24;
const TRIAL_GUARD_PREFIX = "festo:telegram:trial:";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function validateTelegramInitData(initData) {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    throw new Error("BOT_TOKEN is not configured");
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");

  if (!receivedHash) {
    return null;
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const received = Buffer.from(receivedHash, "hex");
  const calculated = Buffer.from(calculatedHash, "hex");

  if (
    received.length !== calculated.length ||
    !crypto.timingSafeEqual(received, calculated)
  ) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));

  if (!authDate || Date.now() / 1000 - authDate > 86400) {
    return null;
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    return null;
  }

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

function makeId(prefix = "restaurant") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function makeLicense() {
  return `FESTO-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

function generateLogin(restaurants, name) {
  const base =
    String(name || "")
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "")
      .slice(0, 12) || "restaurant";

  let login = base;
  let index = 2;

  while (
    restaurants.some(
      (restaurant) =>
        restaurant.login?.toLowerCase() === login.toLowerCase()
    )
  ) {
    login = `${base}${index}`;
    index += 1;
  }

  return login;
}

export default async function handler(req, res) {
  cors(res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const body = req.body || {};
    const telegramUser = validateTelegramInitData(
      String(body.initData || "")
    );

    if (!telegramUser?.id) {
      return res.status(401).json({
        ok: false,
        error: "Недействительные данные Telegram.",
      });
    }

    const required = [
      "legalName",
      "inn",
      "phone",
      "name",
      "address",
    ];

    for (const field of required) {
      if (!String(body[field] || "").trim()) {
        return res.status(400).json({
          ok: false,
          error: `Поле ${field} обязательно.`,
        });
      }
    }

    const bankDetails = {
      bik: String(body.bankDetails?.bik || "").trim(),
      bankName: String(body.bankDetails?.bankName || "").trim(),
      settlementAccount: String(
        body.bankDetails?.settlementAccount || ""
      ).trim(),
      correspondentAccount: String(
        body.bankDetails?.correspondentAccount || ""
      ).trim(),
    };

    for (const [field, value] of Object.entries(bankDetails)) {
      if (!value) {
        return res.status(400).json({
          ok: false,
          error: `Банковский реквизит ${field} обязателен.`,
        });
      }
    }

    const telegramUserId = String(telegramUser.id);
    const guardKey = `${TRIAL_GUARD_PREFIX}${telegramUserId}`;

    const guard = await redis.set(
      guardKey,
      "reserved",
      { nx: true }
    );

    if (guard !== "OK") {
      return res.status(409).json({
        ok: false,
        error: "Бесплатный пробный период для этого Telegram-аккаунта уже использован.",
      });
    }

    const data = await getData();
    const restaurants = Array.isArray(data.restaurants)
      ? data.restaurants
      : [];

    const now = new Date();
    const trialEndsAt = new Date(
      now.getTime() + TRIAL_HOURS * 60 * 60 * 1000
    );

    const restaurant = {
      id: makeId(),
      legalName: String(body.legalName).trim(),
      inn: String(body.inn).trim(),
      phone: String(body.phone).trim(),
      name: String(body.name).trim(),
      address: String(body.address).trim(),
      accent: body.accent || "#6C4BF4",

      bankDetails,

      login: generateLogin(restaurants, body.name),
      password: Math.random().toString(36).slice(-8),

      license: makeLicense(),
      licenseAcceptedAt: null,

      telegramUserId,

      trialStartedAt: now.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      trialDurationHours: TRIAL_HOURS,

      subscriptionActive: true,
      subscriptionType: "trial",
    };

    await saveData({
      ...data,
      restaurants: [...restaurants, restaurant],
    });

    return res.status(201).json({
      ok: true,
      restaurant,
      trialEndsAt: restaurant.trialEndsAt,
    });
  } catch (error) {
    console.error("FESTO Telegram trial error:", error);

    return res.status(500).json({
      ok: false,
      error: "Не удалось создать пробный доступ.",
    });
  }
}
