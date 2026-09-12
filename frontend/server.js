import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);
const HOST = "0.0.0.0";

const DATA_FILE = path.join(__dirname, "festo-data.json");
const DIST_DIR = path.join(__dirname, "dist");

// ------------------------------------------------------------
// DATA
// ------------------------------------------------------------

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {
        orders: []
      };
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");

    if (!raw.trim()) {
      return {
        orders: []
      };
    }

    const data = JSON.parse(raw);

    return {
      orders: Array.isArray(data.orders) ? data.orders : []
    };
  } catch (error) {
    console.error("Ошибка чтения festo-data.json:", error);

    return {
      orders: []
    };
  }
}

function writeData(data) {
  const tempFile = `${DATA_FILE}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  fs.renameSync(tempFile, DATA_FILE);
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(body);
}

function sendText(res, statusCode, text, contentType = "text/plain") {
  res.writeHead(statusCode, {
    "Content-Type": `${contentType}; charset=utf-8`,
    "Cache-Control": "no-store"
  });

  res.end(text);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      // Защита от слишком большого запроса.
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", reject);
  });
}

function parseJsonBody(body) {
  if (!body || !body.trim()) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function normalizeOrder(input) {
  const now = new Date().toISOString();

  return {
    id: input.id || randomUUID(),

    restaurantId:
      input.restaurantId ||
      input.restaurant_id ||
      null,

    tableId:
      input.tableId ||
      input.table_id ||
      null,

    tableName:
      input.tableName ||
      input.table ||
      input.tableNumber ||
      "",

    restaurantName:
      input.restaurantName ||
      "",

    items: Array.isArray(input.items)
      ? input.items
      : Array.isArray(input.dishes)
        ? input.dishes
        : [],

    total: Number(
      input.total ??
      input.amount ??
      0
    ),

    status:
      input.status ||
      "Новый",

    customerName:
      input.customerName ||
      input.name ||
      "",

    customerPhone:
      input.customerPhone ||
      input.phone ||
      "",

    comment:
      input.comment ||
      input.note ||
      "",

    createdAt:
      input.createdAt ||
      now,

    updatedAt:
      input.updatedAt ||
      now
  };
}

// ------------------------------------------------------------
// API
// ------------------------------------------------------------

async function handleApi(req, res, url) {
  // OPTIONS / CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });

    res.end();
    return true;
  }

  // ----------------------------------------------------------
  // GET /api/health
  // ----------------------------------------------------------

  if (url.pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      service: "FESTO server",
      time: new Date().toISOString()
    });

    return true;
  }

  // ----------------------------------------------------------
  // GET /api/orders
  // ----------------------------------------------------------

  if (url.pathname === "/api/orders" && req.method === "GET") {
    const data = readData();

    const restaurantId =
      url.searchParams.get("restaurantId");

    let orders = data.orders;

    if (restaurantId) {
      orders = orders.filter(
        (order) =>
          String(order.restaurantId) === String(restaurantId)
      );
    }

    sendJson(res, 200, {
      ok: true,
      orders
    });

    return true;
  }

  // ----------------------------------------------------------
  // POST /api/orders
  // ----------------------------------------------------------

  if (url.pathname === "/api/orders" && req.method === "POST") {
    try {
      const body = await readRequestBody(req);
      const input = parseJsonBody(body);

      if (input === null) {
        sendJson(res, 400, {
          ok: false,
          error: "Некорректный JSON"
        });

        return true;
      }

      const order = normalizeOrder(input);

      if (!order.restaurantId) {
        sendJson(res, 400, {
          ok: false,
          error: "Не указан restaurantId"
        });

        return true;
      }

      if (!order.tableId) {
        sendJson(res, 400, {
          ok: false,
          error: "Не указан tableId"
        });

        return true;
      }

      const data = readData();

      // Не создаём дубликат, если клиент повторно отправил
      // заказ с тем же ID.
      const existingIndex = data.orders.findIndex(
        (item) => item.id === order.id
      );

      if (existingIndex >= 0) {
        data.orders[existingIndex] = {
          ...data.orders[existingIndex],
          ...order,
          updatedAt: new Date().toISOString()
        };
      } else {
        data.orders.unshift(order);
      }

      writeData(data);

      console.log(
        `[ORDER] Новый заказ ${order.id} | ресторан=${order.restaurantId} | стол=${order.tableId}`
      );

      sendJson(res, 201, {
        ok: true,
        order
      });

      return true;
    } catch (error) {
      console.error("Ошибка создания заказа:", error);

      sendJson(res, 500, {
        ok: false,
        error: "Не удалось сохранить заказ"
      });

      return true;
    }
  }

  // ----------------------------------------------------------
  // PATCH /api/orders/:id
  // ----------------------------------------------------------

  const orderMatch = url.pathname.match(
    /^\/api\/orders\/([^/]+)$/
  );

  if (orderMatch && (
    req.method === "PATCH" ||
    req.method === "PUT"
  )) {
    const orderId = decodeURIComponent(orderMatch[1]);

    try {
      const body = await readRequestBody(req);
      const input = parseJsonBody(body);

      if (input === null) {
        sendJson(res, 400, {
          ok: false,
          error: "Некорректный JSON"
        });

        return true;
      }

      const data = readData();

      const index = data.orders.findIndex(
        (order) => String(order.id) === String(orderId)
      );

      if (index === -1) {
        sendJson(res, 404, {
          ok: false,
          error: "Заказ не найден"
        });

        return true;
      }

      data.orders[index] = {
        ...data.orders[index],
        ...input,
        updatedAt: new Date().toISOString()
      };

      writeData(data);

      sendJson(res, 200, {
        ok: true,
        order: data.orders[index]
      });

      return true;
    } catch (error) {
      console.error("Ошибка обновления заказа:", error);

      sendJson(res, 500, {
        ok: false,
        error: "Не удалось обновить заказ"
      });

      return true;
    }
  }

  // ----------------------------------------------------------
  // DELETE /api/orders/:id
  // ----------------------------------------------------------

  if (orderMatch && req.method === "DELETE") {
    const orderId = decodeURIComponent(orderMatch[1]);

    const data = readData();

    const oldLength = data.orders.length;

    data.orders = data.orders.filter(
      (order) => String(order.id) !== String(orderId)
    );

    if (data.orders.length === oldLength) {
      sendJson(res, 404, {
        ok: false,
        error: "Заказ не найден"
      });

      return true;
    }

    writeData(data);

    sendJson(res, 200, {
      ok: true
    });

    return true;
  }

  // ----------------------------------------------------------
  // DELETE /api/orders
  // ----------------------------------------------------------

  if (
    url.pathname === "/api/orders" &&
    req.method === "DELETE"
  ) {
    const data = readData();

    const restaurantId =
      url.searchParams.get("restaurantId");

    if (restaurantId) {
      data.orders = data.orders.filter(
        (order) =>
          String(order.restaurantId) !== String(restaurantId)
      );
    } else {
      data.orders = [];
    }

    writeData(data);

    sendJson(res, 200, {
      ok: true
    });

    return true;
  }

  // API route not found
  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, {
      ok: false,
      error: "API route not found"
    });

    return true;
  }

  return false;
}

// ------------------------------------------------------------
// STATIC FILES
// ------------------------------------------------------------

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

function getSafeFilePath(urlPath) {
  let decoded;

  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  decoded = decoded.split("?")[0];

  if (decoded === "/") {
    decoded = "/index.html";
  }

  // Защита от ../
  const normalized = path.normalize(decoded);

  if (
    normalized.includes("..") ||
    path.isAbsolute(normalized) && normalized !== "/index.html"
  ) {
    return null;
  }

  const relative = normalized.replace(/^[/\\]+/, "");

  const filePath = path.join(DIST_DIR, relative);

  if (!filePath.startsWith(DIST_DIR)) {
    return null;
  }

  return filePath;
}

function serveStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendText(res, 405, "Method Not Allowed");
    return;
  }

  // Если dist ещё не существует.
  if (!fs.existsSync(DIST_DIR)) {
    sendText(
      res,
      500,
      "Папка dist не найдена. Сначала выполните: npm run build"
    );

    return;
  }

  let filePath = getSafeFilePath(url.pathname);

  if (!filePath) {
    sendText(res, 400, "Bad Request");
    return;
  }

  // Если конкретного файла нет — отдаём index.html.
  // Это важно для React Router / hash-маршрутов.
  if (
    !fs.existsSync(filePath) ||
    !fs.statSync(filePath).isFile()
  ) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    sendText(
      res,
      500,
      "index.html не найден. Выполните npm run build"
    );

    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  const contentType =
    MIME_TYPES[ext] ||
    "application/octet-stream";

  try {
    const stat = fs.statSync(filePath);

    res.writeHead(200, {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Length": stat.size,
      "Cache-Control":
        ext === ".html"
          ? "no-cache"
          : "public, max-age=3600"
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("Ошибка раздачи файла:", error);

    sendText(
      res,
      500,
      "Ошибка чтения файла"
    );
  }
}

// ------------------------------------------------------------
// SERVER
// ------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    );

    console.log(
      `${req.method} ${url.pathname}`
    );

    const handled = await handleApi(
      req,
      res,
      url
    );

    if (handled) {
      return;
    }

    serveStatic(req, res, url);
  } catch (error) {
    console.error("Необработанная ошибка:", error);

    if (!res.headersSent) {
      sendJson(res, 500, {
        ok: false,
        error: "Internal Server Error"
      });
    } else {
      res.end();
    }
  }
});

// Создаём файл базы, если его ещё нет.
if (!fs.existsSync(DATA_FILE)) {
  writeData({
    orders: []
  });
}

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("======================================");
  console.log("        FESTO SERVER STARTED");
  console.log("======================================");
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://0.0.0.0:${PORT}`);
  console.log("");
  console.log("API:");
  console.log(`GET    /api/health`);
  console.log(`GET    /api/orders`);
  console.log(`POST   /api/orders`);
  console.log(`PATCH  /api/orders/:id`);
  console.log(`DELETE /api/orders/:id`);
  console.log("======================================");
  console.log("");
});