import { getData } from "../lib/redis.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  const restaurantId = String(req.query?.restaurantId || "").trim();

  if (!restaurantId) {
    return res.status(400).json({
      ok: false,
      error: "restaurantId is required",
    });
  }

  try {
    const data = await getData();

    const restaurant = (data.restaurants || []).find(
      (item) => item?.id === restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        ok: false,
        error: "Restaurant not found",
      });
    }

    if (restaurant.subscriptionType === "trial") {
      const endsAt = restaurant.trialEndsAt
        ? new Date(restaurant.trialEndsAt).getTime()
        : 0;

      const active = endsAt > Date.now();

      return res.status(200).json({
        ok: true,
        active,
        type: "trial",
        trialStartedAt: restaurant.trialStartedAt || null,
        trialEndsAt: restaurant.trialEndsAt || null,
      });
    }

    return res.status(200).json({
      ok: true,
      active: restaurant.subscriptionActive === true,
      type: restaurant.subscriptionType || "unknown",
      trialStartedAt: restaurant.trialStartedAt || null,
      trialEndsAt: restaurant.trialEndsAt || null,
    });
  } catch (error) {
    console.error("FESTO license API error:", error);

    return res.status(500).json({
      ok: false,
      error: "FESTO license check failed",
    });
  }
}
