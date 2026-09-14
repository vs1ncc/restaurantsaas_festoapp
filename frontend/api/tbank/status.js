import { getData } from "../../lib/redis.js";

function sendJson(res, status, data) {
  res.status(status).json(data);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return sendJson(res, 405, {
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const orderId =
      String(req.query?.orderId || "").trim();

    if (!orderId) {
      return sendJson(res, 400, {
        ok: false,
        error: "orderId is required",
      });
    }

    const data = await getData();

    const payments =
      Array.isArray(data.tbankPayments)
        ? data.tbankPayments
        : [];

    const payment =
      payments.find(
        (item) =>
          String(item.orderId) === orderId
      );

    if (!payment) {
      return sendJson(res, 404, {
        ok: false,
        error: "Payment not found",
      });
    }

    const orders =
      Array.isArray(data.orders)
        ? data.orders
        : [];

    const order =
      orders.find(
        (item) =>
          String(item.paymentOrderId || "") ===
          orderId
      );

    return sendJson(res, 200, {
      ok: true,
      orderId,

      status:
        payment.status || "NEW",

      confirmed:
        String(payment.status || "")
          .toUpperCase() === "CONFIRMED",

      orderCreated:
        Boolean(payment.orderCreated),

      createdOrderId:
        payment.orderIdCreated || null,

      order: order
        ? {
            id: order.id,
            number: order.number,
            status: order.status,
            restaurantId: order.restaurantId,
            tableId: order.tableId,
            createdAt: order.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "FESTO T-Bank status error:",
      error
    );

    return sendJson(res, 500, {
      ok: false,
      error: "Unable to read payment status",
    });
  }
}
