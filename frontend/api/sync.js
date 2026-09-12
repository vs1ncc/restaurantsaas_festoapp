import { getData, saveData } from "../lib/redis.js";

function mergeById(current = [], incoming = []) {
  const map = new Map();

  for (const item of current) {
    if (item?.id) {
      map.set(item.id, item);
    }
  }

  for (const item of incoming) {
    if (item?.id) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const body = req.body || {};

    const current = await getData();

    const next = {
      ...current,

      restaurants: mergeById(
        current.restaurants,
        Array.isArray(body.restaurants) ? body.restaurants : []
      ),

      categories: mergeById(
        current.categories,
        Array.isArray(body.categories) ? body.categories : []
      ),

      dishes: mergeById(
        current.dishes,
        Array.isArray(body.dishes) ? body.dishes : []
      ),

      tables: mergeById(
        current.tables,
        Array.isArray(body.tables) ? body.tables : []
      ),

      orders: Array.isArray(current.orders)
        ? current.orders
        : [],
    };

    await saveData(next);

    return res.status(200).json({
      ok: true,
      restaurants: next.restaurants.length,
      categories: next.categories.length,
      dishes: next.dishes.length,
      tables: next.tables.length,
      orders: next.orders.length,
    });
  } catch (error) {
    console.error("FESTO sync error:", error);

    return res.status(500).json({
      error: "FESTO sync failed",
      message: error?.message || "Unknown error",
    });
  }
}
