import { getData } from "../../../_redis.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const restaurantId = String(
      req.query.restaurantId || ""
    );

    const tableId = String(
      req.query.tableId || ""
    );

    if (!restaurantId || !tableId) {
      return res.status(400).json({
        error: "Не указан ресторан или стол",
      });
    }

    const data = await getData();

    const restaurant = data.restaurants.find(
      (item) =>
        String(item.id) === restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        error: "Ресторан не найден",
      });
    }

    const table = data.tables.find(
      (item) =>
        String(item.id) === tableId &&
        String(item.restaurantId) === restaurantId
    );

    if (!table) {
      return res.status(404).json({
        error: "Стол не найден",
      });
    }

    const categories = data.categories
      .filter(
        (item) =>
          String(item.restaurantId) === restaurantId
      )
      .sort(
        (a, b) =>
          Number(a.sort || 0) -
          Number(b.sort || 0)
      )
      .map((item) => ({
        id: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        sort: item.sort,
      }));

    const dishes = data.dishes
      .filter(
        (item) =>
          String(item.restaurantId) === restaurantId &&
          item.active !== false
      )
      .map((item) => ({
        id: item.id,
        restaurantId: item.restaurantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || "",
        ingredients: item.ingredients || "",
        price: Number(item.price || 0),
        image:
          String(item.image || "").startsWith("http")
            ? item.image
            : "",
        active: item.active !== false,
      }));

    return res.status(200).json({
      version: 1,

      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        accent:
          restaurant.accent || "#6C4BF4",
      },

      table: {
        id: table.id,
        name: table.name,
        number: table.number,
        restaurantId: table.restaurantId,
      },

      categories,

      dishes,
    });
  } catch (error) {
    console.error(
      "FESTO /api/public-menu error:",
      error
    );

    return res.status(500).json({
      error: "Не удалось загрузить меню",
    });
  }
}