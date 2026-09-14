import { createHash } from "crypto";
import { getData, saveData } from "../../lib/redis.js";

function createTBankToken(params, password) {
  const tokenParams = {
    ...params,
    Password: password,
  };

  const values = Object.entries(tokenParams)
    .filter(([key, value]) => {
      if (key === "Token") return false;
      if (key === "Data") return false;
      if (key === "Receipt") return false;

      return (
        value !== undefined &&
        value !== null &&
        typeof value !== "object"
      );
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => String(value));

  return createHash("sha256")
    .update(values.join(""))
    .digest("hex");
}

function timingSafeEqualHex(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    a.length !== b.length
  ) {
    return false;
  }

  return createHash("sha256")
    .update(a.toLowerCase())
    .digest("hex") ===
    createHash("sha256")
      .update(b.toLowerCase())
      .digest("hex");
}

function getCalendarDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function getNextOrderSequence(
  orders,
  restaurantId,
  tableNumber,
  now
) {
  const today = getCalendarDate(now);

  const tableOrdersToday = orders.filter((order) => {
    if (order.restaurantId !== restaurantId) {
      return false;
    }

    const orderDate = order.orderDate
      ? order.orderDate
      : order.createdAt
        ? getCalendarDate(new Date(order.createdAt))
        : null;

    return (
      orderDate === today &&
      getTableNumber(order) === Number(tableNumber)
    );
  });

  let maxSequence = 0;

  for (const order of tableOrdersToday) {
    if (
      order.dailySequence !== undefined &&
      Number.isFinite(Number(order.dailySequence))
    ) {
      maxSequence = Math.max(
        maxSequence,
        Number(order.dailySequence)
      );
      continue;
    }

    const oldNumber = String(order.number ?? "");

    if (!oldNumber) {
      continue;
    }

    const tablePrefix = String(tableNumber);

    if (oldNumber.startsWith(tablePrefix)) {
      const possibleSequence = Number(
        oldNumber.slice(tablePrefix.length)
      );

      if (Number.isFinite(possibleSequence)) {
        maxSequence = Math.max(
          maxSequence,
          possibleSequence
        );
      }
    }
  }

  return maxSequence + 1;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const terminalKey =
      process.env.T_BANK_TERMINAL_KEY;

    const password =
      process.env.T_BANK_PASSWORD;

    if (!terminalKey || !password) {
      console.error(
        "FESTO T-Bank notification: credentials are not configured"
      );

      return res.status(500).send("Configuration error");
    }

    const notification = req.body || {};

    console.log(
      "FESTO T-Bank notification:",
      {
        OrderId: notification.OrderId,
        PaymentId: notification.PaymentId,
        Status: notification.Status,
        Success: notification.Success,
        Amount: notification.Amount,
      }
    );

    /*
     * Проверяем, что уведомление относится
     * именно к нашему терминалу.
     */
    if (
      String(notification.TerminalKey || "") !==
      String(terminalKey)
    ) {
      console.error(
        "FESTO T-Bank notification: invalid TerminalKey"
      );

      return res.status(400).send("Invalid terminal");
    }

    /*
     * Проверяем Token до любой обработки платежа.
     */
    if (!notification.Token) {
      console.error(
        "FESTO T-Bank notification: Token is missing"
      );

      return res.status(400).send("Token is missing");
    }

    const expectedToken =
      createTBankToken(
        notification,
        password
      );

    if (
      !timingSafeEqualHex(
        notification.Token,
        expectedToken
      )
    ) {
      console.error(
        "FESTO T-Bank notification: invalid Token"
      );

      return res.status(400).send("Invalid token");
    }

    const orderId =
      String(notification.OrderId || "");

    if (!orderId) {
      return res.status(400).send("OrderId is missing");
    }

    const data = await getData();

    if (!Array.isArray(data.orders)) {
      data.orders = [];
    }

    if (!Array.isArray(data.tbankPayments)) {
      data.tbankPayments = [];
    }

    const paymentIndex =
      data.tbankPayments.findIndex(
        (payment) =>
          String(payment.orderId) === orderId
      );

    if (paymentIndex === -1) {
      console.error(
        "FESTO T-Bank notification: pending payment not found",
        orderId
      );

      /*
       * Возвращаем 200, чтобы T-Банк не пытался
       * бесконечно повторять уведомление для
       * неизвестного/уже удалённого платежа.
       */
      return res.status(200).send("OK");
    }

    const payment =
      data.tbankPayments[paymentIndex];

    /*
     * Проверяем сумму.
     */
    if (
      notification.Amount !== undefined &&
      Number(notification.Amount) !==
        Number(payment.amount)
    ) {
      console.error(
        "FESTO T-Bank notification: amount mismatch",
        {
          orderId,
          expected: payment.amount,
          received: notification.Amount,
        }
      );

      return res.status(400).send("Amount mismatch");
    }

    /*
     * CONFIRMED — единственный статус, при котором
     * создаём реальный заказ в Live.
     */
    const status =
      String(notification.Status || "")
        .toUpperCase();

    payment.status = status;
    payment.paymentId =
      notification.PaymentId ??
      payment.paymentId ??
      null;
    payment.updatedAt =
      new Date().toISOString();

    /*
     * Если T-Банк прислал промежуточный статус,
     * просто сохраняем его.
     */
    if (status !== "CONFIRMED") {
      await saveData(data);

      return res.status(200).send("OK");
    }

    /*
     * Идемпотентность.
     *
     * Если CONFIRMED пришёл повторно,
     * второй заказ не создаём.
     */
    if (payment.orderCreated && payment.orderIdCreated) {
      await saveData(data);

      return res.status(200).send("OK");
    }

    /*
     * Дополнительная защита:
     * если заказ с этим paymentOrderId уже существует,
     * считаем его созданным.
     */
    const existingOrder =
      data.orders.find(
        (order) =>
          String(order.paymentOrderId || "") ===
          orderId
      );

    if (existingOrder) {
      payment.orderCreated = true;
      payment.orderIdCreated =
        existingOrder.id;

      await saveData(data);

      return res.status(200).send("OK");
    }

    const now = new Date();

    const tableNumber =
      getTableNumber(payment);

    const dailySequence =
      getNextOrderSequence(
        data.orders,
        payment.restaurantId,
        tableNumber,
        now
      );

    const orderNumber = Number(
      `${tableNumber}${dailySequence}`
    );

    const orderIdCreated =
      `order_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    const order = {
      id: orderIdCreated,

      restaurantId:
        payment.restaurantId,

      tableId:
        payment.tableId,

      tableName:
        payment.tableName ||
        `Стол ${tableNumber}`,

      tableNumber,

      items:
        Array.isArray(payment.items)
          ? payment.items
          : [],

      total:
        Number(payment.total),

      comment:
        payment.comment || "",

      status: "new",

      number: orderNumber,

      dailySequence,

      orderDate:
        getCalendarDate(now),

      createdAt:
        now.toISOString(),

      paymentMethod: "tbank",

      paymentStatus: "CONFIRMED",

      paymentOrderId: orderId,

      paymentId:
        notification.PaymentId ??
        payment.paymentId ??
        null,
    };

    data.orders.push(order);

    payment.orderCreated = true;
    payment.orderIdCreated =
      order.id;

    payment.status = "CONFIRMED";
    payment.confirmedAt =
      now.toISOString();

    await saveData(data);

    console.log(
      "FESTO T-Bank payment confirmed; order created:",
      {
        paymentOrderId: orderId,
        orderId: order.id,
        orderNumber: order.number,
      }
    );

    return res.status(200).send("OK");
  } catch (error) {
    console.error(
      "FESTO T-Bank notification error:",
      error
    );

    return res.status(500).send("Internal error");
  }
}
