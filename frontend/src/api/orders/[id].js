import { getData, saveData } from "../_redis.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const id = String(req.query.id || "");

    if (!id) {
      return res.status(400).json({
        error: "Не указан ID заказа",
      });
    }

    const data = await getData();

    const orders = Array.isArray(data.orders)
      ? data.orders
      : [];

    const index = orders.findIndex(
      (order) =>
        String(order.id) === id
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Заказ не найден",
      });
    }

    if (
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      const update = req.body || {};

      const updated = {
        ...orders[index],
        ...update,
        id: orders[index].id,
        updatedAt:
          new Date().toISOString(),
      };

      orders[index] = updated;

      data.orders = orders;

      await saveData(data);

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      orders.splice(index, 1);

      data.orders = orders;

      await saveData(data);

      return res.status(200).json({
        ok: true,
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error(
      "FESTO /api/orders/:id error:",
      error
    );

    return res.status(500).json({
      error: "Ошибка обновления заказа",
    });
  }
}
