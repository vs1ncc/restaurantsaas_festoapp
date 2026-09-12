import { getData, saveData } from "./_redis.js";

function mergeById(oldItems = [], newItems = []) {
  const map = new Map(
    oldItems.map((item) => [String(item.id), item])
  );

  for (const item of newItems) {
    if (!item?.id) continue;

    map.set(String(item.id), item);
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
      restaurants: mergeById(
        current.restaurants,
        Array.isArray(body.restaurants)
          ? body.restaurants
          : []
      ),

      categories: mergeById(
        current.categories,
        Array.isArray(body.categories)
          ? body.categories
          : []
      ),

      dishes: mergeById(
        current.dishes,
        Array.isArray(body.dishes)
          ? body.dishes
          : []
      ),

      tables: mergeById(
        current.tables,
        Array.isArray(body.tables)
          ? body.tables
          : []
      ),

      orders: Array.isArray(current.orders)
        ? current.orders
        : [],
    };

    await saveData(next);

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error("FESTO /api/sync error:", error);

    return res.status(500).json({
      ok: false,
      error: "Не удалось синхронизировать данные FESTO",
    });
  }
}