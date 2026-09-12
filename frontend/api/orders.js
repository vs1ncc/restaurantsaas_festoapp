import { getData, saveData } from "../lib/redis.js";

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function getTableNumber(order) {
  const raw =
    order.tableNumber ??
    order.table?.number ??
    order.tableName ??
    order.table?.name ??
    0;

  const match = String(raw).match(/\d+/);

  return match ? Number(match[0]) : 0;
}

function getCalendarDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextOrderNumber(orders, restaurantId, tableNumber, now) {
  const today = getCalendarDate(now);

  const tableOrdersToday = orders.filter((order) => {
    if (order.restaurantId !== restaurantId) {
      return false;
    }

    if (getCalendarDate(new Date(order.createdAt)) !== today) {
      return false;
    }

    return getTableNumber(order) === Number(tableNumber);
  });

  let maxSequence = 0;

  for (const order of tableOrdersToday) {
    if (Number.isFinite(Number(order.dailySequence))) {
      maxSequence = Math.max(
        maxSequence,
        Number(order.dailySequence)
      );
      continue;
    }

    // Поддержка старых заказов, у которых dailySequence ещё нет.
    const oldNumber = String(order.number ?? "");

    if (oldNumber.length > 1) {
      const oldTable = getTableNumber(order);

      if (oldTable === Number(tableNumber)) {
        const possibleSequence = Number(
          oldNumber.slice(String(tableNumber).length)
        );

        if (Number.isFinite(possibleSequence)) {
          maxSequence = Math.max(
            maxSequence,
            possibleSequence
          );
        }
      }
    }
  }

  return maxSequence + 1;
}

export default async function handler(req, res) {
  try {
    const data = await getData();

    if (!Array.isArray(data.orders)) {
      data.orders = [];
    }

    // GET /api/orders?restaurantId=...
    if (req.method === "GET") {
      const restaurantId = req.query?.restaurantId;

      let orders = data.orders;

      if (restaurantId) {
        orders = orders.filter(
          (order) => order.restaurantId === restaurantId
        );
      }

      return sendJson(res, 200, {
        ok: true,
        orders,
      });
    }

    // POST /api/orders
    if (req.method === "POST") {
      const body = req.body || {};

      if (!body.restaurantId) {
        return sendJson(res, 400, {
          ok: false,
          error: "restaurantId is required",
        });
      }

      if (!body.tableId) {
        return sendJson(res, 400, {
          ok: false,
          error: "tableId is required",
        });
      }

      if (!Array.isArray(body.items) || body.items.length === 0) {
        return sendJson(res, 400, {
          ok: false,
          error: "Order must contain at least one item",
        });
      }

      const now = new Date();

      const tableNumber = getTableNumber(body);

      const dailySequence = getNextOrderNumber(
        data.orders,
        body.restaurantId,
        tableNumber,
        now
      );

      /*
       * Номер заказа:
       *
       * Стол 1 + заказ 1 = 11
       * Стол 1 + заказ 2 = 12
       * Стол 2 + заказ 1 = 21
       * Стол 2 + заказ 3 = 23
       *
       * Например:
       * Стол 7 + заказ 12 = 712
       */
      const orderNumber = Number(
        `${tableNumber}${dailySequence}`
      );

      const order = {
        ...body,

        id:
          body.id ||
          `order_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        number: orderNumber,

        dailySequence,

        orderDate: getCalendarDate(now),

        tableNumber,

        createdAt:
          body.createdAt ||
          now.toISOString(),

        status:
          body.status ||
          "new",
      };

      data.orders.push(order);

      await saveData(data);

      return sendJson(res, 201, {
        ok: true,
        order,
      });
    }

    return sendJson(res, 405, {
      ok: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("FESTO orders API error:", error);

    return sendJson(res, 500, {
      ok: false,
      error: error.message || "Internal server error",
    });
  }
}