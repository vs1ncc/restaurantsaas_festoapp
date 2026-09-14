import { randomUUID, createHash } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import https from "https";
import { getData, saveData } from "../../lib/redis.js";

const TBANK_INIT_URL = "https://securepay.tinkoff.ru/v2/Init";

// Keep the certificate in the Vercel Function bundle and pass it
// directly to the TLS connection used for the T-Bank API request.
const HARICA_CERT_PATH = fileURLToPath(new URL("./harica.crt", import.meta.url));
const HARICA_CERT = readFileSync(HARICA_CERT_PATH);

function postTBankInit(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(TBANK_INIT_URL);
    const requestBody = JSON.stringify(payload);

    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
        ca: HARICA_CERT,
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          try {
            const result = JSON.parse(body);

            resolve({
              ok:
                response.statusCode >= 200 &&
                response.statusCode < 300,
              status: response.statusCode,
              result,
            });
          } catch (error) {
            error.message =
              `Invalid JSON response from T-Bank: ${error.message}`;
            reject(error);
          }
        });
      }
    );

    request.on("error", reject);
    request.end(requestBody);
  });
}

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function getPublicBaseUrl(req) {
  if (process.env.FESTO_PUBLIC_URL) {
    return process.env.FESTO_PUBLIC_URL.replace(/\/+$/, "");
  }

  const forwardedProto =
    req.headers["x-forwarded-proto"] ||
    "https";

  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host;

  if (!host) {
    throw new Error("Unable to determine public host");
  }

  return `${forwardedProto}://${host}`.replace(/\/+$/, "");
}

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
    .sort(([a], [b]) =>
      a.localeCompare(b)
    )
    .map(([, value]) => String(value));

  return createHash("sha256")
    .update(values.join(""))
    .digest("hex");
}

function normalizeItems(items) {
  return items.map((item) => ({
    dishId: item?.dishId,
    name: String(item?.name || ""),
    price: Number(item?.price),
    quantity: Number(item?.quantity),
  }));
}

function calculateTotal(items) {
  return items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const terminalKey =
      process.env.T_BANK_TERMINAL_KEY;

    const password =
      process.env.T_BANK_PASSWORD;

    if (!terminalKey || !password) {
      console.error(
        "FESTO T-Bank: credentials are not configured"
      );

      return sendJson(res, 500, {
        ok: false,
        error:
          "T-Bank acquiring is not configured",
      });
    }

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

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return sendJson(res, 400, {
        ok: false,
        error:
          "Order must contain at least one item",
      });
    }

    const items = normalizeItems(body.items);

    const invalidItem = items.find(
      (item) =>
        !item.name ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    );

    if (invalidItem) {
      return sendJson(res, 400, {
        ok: false,
        error: "Invalid order items",
      });
    }

    const total = calculateTotal(items);

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return sendJson(res, 400, {
        ok: false,
        error: "Invalid order total",
      });
    }

    const amount = Math.round(total * 100);

    const orderId =
      `festo_${Date.now()}_${randomUUID()
        .replace(/-/g, "")
        .slice(0, 12)}`;

    const publicBaseUrl =
      getPublicBaseUrl(req);

    const notificationUrl =
      `${publicBaseUrl}/api/tbank/notification`;

    const successUrl =
      `${publicBaseUrl}/?tbank=success&orderId=${encodeURIComponent(orderId)}`;

    const failUrl =
      `${publicBaseUrl}/?tbank=fail&orderId=${encodeURIComponent(orderId)}`;

    const initParams = {
      TerminalKey: terminalKey,
      Amount: amount,
      OrderId: orderId,
      Description:
        `Заказ FESTO, стол ${body.tableNumber ?? body.tableName ?? ""}`,
      NotificationURL: notificationUrl,
      SuccessURL: successUrl,
      FailURL: failUrl,
    };

    const token =
      createTBankToken(
        initParams,
        password
      );

    const { ok, status, result } =
      await postTBankInit({
        ...initParams,
        Token: token,
      });

    if (
      !ok ||
      !result.Success ||
      !result.PaymentURL
    ) {
      console.error(
        "FESTO T-Bank Init error:",
        {
          httpStatus: status,
          response: result,
        }
      );

      return sendJson(res, 502, {
        ok: false,
        error:
          result.Message ||
          result.Details ||
          "T-Bank payment initialization failed",
      });
    }

    /*
     * Заказ в orders[] здесь НЕ создаём.
     *
     * Сохраняем только ожидающий платёж.
     * Notification после CONFIRMED использует
     * эту запись для создания настоящего заказа.
     */
    const data = await getData();

    if (!Array.isArray(data.tbankPayments)) {
      data.tbankPayments = [];
    }

    data.tbankPayments.push({
      orderId,
      restaurantId: body.restaurantId,
      tableId: body.tableId,
      tableName:
        body.tableName ||
        `Стол ${body.tableNumber ?? ""}`,
      tableNumber:
        body.tableNumber ??
        body.tableName ??
        "0",
      items,
      total,
      amount,
      comment:
        String(body.comment || "").trim(),
      status: "NEW",
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    });

    await saveData(data);

    return sendJson(res, 200, {
      ok: true,
      orderId,
      paymentId:
        result.PaymentId ?? null,
      paymentUrl:
        result.PaymentURL,
    });
  } catch (error) {
    console.error(
      "FESTO T-Bank payment error:",
      {
        name: error?.name || null,
        message: error?.message || null,
        code: error?.code || null,
        causeName: error?.cause?.name || null,
        causeMessage: error?.cause?.message || null,
        causeCode: error?.cause?.code || null,
      }
    );

    return sendJson(res, 500, {
      ok: false,
      error:
        error?.message ||
        "T-Bank payment initialization failed",
    });
  }
}
