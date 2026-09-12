import { getData, saveData } from "../lib/redis.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const data = await getData();

    if (!Array.isArray(data.orders)) {
      data.orders = [];
    }

    // GET — получить заказы
    if (req.method === "GET") {
      const restaurantId = req.query?.restaurantId;

      if (!restaurantId) {
        return res.status(400).json({
          error: "restaurantId is required",
        });
      }

      const orders = data.orders.filter(
        (order) =>
          String(order.restaurantId) === String(restaurantId)
      );

      return res.status(200).json(orders);
    }

    // POST — создать новый заказ
    if (req.method === "POST") {
      const order = req.body;

      if (!order || typeof order !== "object") {
        return res.status(400).json({
          error: "Order data is required",
        });
      }

      if (!order.restaurantId) {
        return res.status(400).json({
          error: "restaurantId is required",
        });
      }

      if (!order.tableId) {
        return res.status(400).json({
          error: "tableId is required",
        });
      }

      const newOrder = {
        ...order,
        id:
          order.id ||
          `order-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        createdAt:
          order.createdAt || new Date().toISOString(),
        status: order.status || "new",
      };

      data.orders = [
        ...data.orders.filter(
          (item) => item.id !== newOrder.id
        ),
        newOrder,
      ];

      await saveData(data);

      return res.status(201).json(newOrder);
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("FESTO orders error:", error);

    return res.status(500).json({
      error: "Orders API failed",
      message: error?.message || "Unknown error",
    });
  }
}
