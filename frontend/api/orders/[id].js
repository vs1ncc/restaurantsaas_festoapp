import { getData, saveData } from "../../lib/redis.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "Order id is required",
      });
    }

    const data = await getData();

    if (!Array.isArray(data.orders)) {
      data.orders = [];
    }

    const orderIndex = data.orders.findIndex(
      (order) => String(order.id) === String(id)
    );

    // PUT / PATCH — изменить заказ
    if (req.method === "PUT" || req.method === "PATCH") {
      if (orderIndex === -1) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      const currentOrder = data.orders[orderIndex];
      const updates = req.body || {};

      const updatedOrder = {
        ...currentOrder,
        ...updates,
        id: currentOrder.id,
      };

      data.orders[orderIndex] = updatedOrder;

      await saveData(data);

      return res.status(200).json(updatedOrder);
    }

    // DELETE — удалить заказ
    if (req.method === "DELETE") {
      if (orderIndex === -1) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      const deletedOrder = data.orders[orderIndex];

      data.orders.splice(orderIndex, 1);

      await saveData(data);

      return res.status(200).json({
        ok: true,
        order: deletedOrder,
      });
    }

    // GET — получить один заказ
    if (req.method === "GET") {
      if (orderIndex === -1) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      return res.status(200).json(
        data.orders[orderIndex]
      );
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("FESTO order update error:", error);

    return res.status(500).json({
      error: "Order API failed",
      message: error?.message || "Unknown error",
    });
  }
}
