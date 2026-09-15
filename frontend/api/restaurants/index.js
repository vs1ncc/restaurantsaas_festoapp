import { getData, saveData } from "../../lib/redis.js";

const TRIAL_HOURS = 24;

function makeId(prefix = "restaurant") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
  res.setHeader("Cache-Control", "no-store");

  try {
    const data = await getData();
    const restaurants = Array.isArray(data.restaurants)
      ? data.restaurants
      : [];

    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        restaurants,
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed",
      });
    }

    const body = req.body || {};

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

      // Временно сохраняем совместимость со старой моделью.
      // Позже пароль перенесём полностью на серверный auth.
      password: Math.random().toString(36).slice(-8),

      license: makeLicense(),
      licenseAcceptedAt: null,

      trialStartedAt: null,
      trialEndsAt: null,
      trialDurationHours: TRIAL_HOURS,

      subscriptionActive: false,
      subscriptionType: "trial",
    };

    const next = {
      ...data,
      restaurants: [...restaurants, restaurant],
    };

    await saveData(next);

    return res.status(201).json({
      ok: true,
      restaurant,
    });
  } catch (error) {
    console.error("FESTO restaurants API error:", error);

    return res.status(500).json({
      ok: false,
      error: "FESTO restaurant API failed",
      message: error?.message || "Unknown error",
    });
  }
}
