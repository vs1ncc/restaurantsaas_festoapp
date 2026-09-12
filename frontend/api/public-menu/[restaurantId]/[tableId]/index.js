import { getData } from "../../../../lib/redis.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { restaurantId, tableId } = req.query;

    if (!restaurantId || !tableId) {
      return res.status(400).json({
        error: "restaurantId and tableId are required",
      });
    }

    const data = await getData();

    const restaurant = (data.restaurants || []).find(
      (item) => String(item.id) === String(restaurantId)
    );

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
      });
    }

    const table = (data.tables || []).find(
      (item) =>
        String(item.id) === String(tableId) &&
        String(item.restaurantId) === String(restaurantId)
    );

    if (!table) {
      return res.status(404).json({
        error: "Table not found",
      });
    }

    const categories = (data.categories || []).filter(
      (item) =>
        String(item.restaurantId) === String(restaurantId)
    );

    const dishes = (data.dishes || []).filter(
      (item) =>
        String(item.restaurantId) === String(restaurantId)
    );

    return res.status(200).json({
      version: 1,

      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        logo: restaurant.logo || null,
      },

      table: {
        id: table.id,
        number: table.number,
      },

      categories,
      dishes,
    });
  } catch (error) {
    console.error("FESTO public menu error:", error);

    return res.status(500).json({
      error: "Public menu failed",
      message: error?.message || "Unknown error",
    });
  }
}
