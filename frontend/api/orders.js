import { getData, saveData } from "../lib/redis.js";

function sendJson(res, status, data) {
  res.status(status).json(data);
}

/**
 * Получаем номер стола из заказа.
 *
 * Поддерживаются разные варианты:
 * - tableNumber: 2
 * - table.number: 2
 * - tableName: "Стол 2"
 * - table.name: "Стол 2"
 */
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

/**
 * Возвращает календарную дату в формате YYYY-MM-DD.
 *
 * Используется локальное время сервера.
 */
function getCalendarDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Определяем следующий порядковый номер заказа
 * для конкретного ресторана + конкретного стола + текущего дня.
 *
 * Например:
 *
 * Стол 1:
 * первый заказ  -> sequence 1
 * второй заказ  -> sequence 2
 * третий заказ  -> sequence 3
 *
 * Стол 2:
 * первый заказ  -> sequence 1
 * второй заказ  -> sequence 2
 * третий заказ  -> sequence 3
 */
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

    if (orderDate !== today) {
      return false;
    }

    return getTableNumber(order) === Number(tableNumber);
  });

  let maxSequence = 0;

  for (const order of tableOrdersToday) {
    /*
     * Новые заказы имеют dailySequence.
     */
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

    /*
     * Совместимость со старыми заказами,
     * которые могли быть созданы до введения
     * dailySequence.
     */
    const oldNumber = String(order.number ?? "");

    if (!oldNumber) {
      continue;
    }

    const tablePrefix = String(tableNumber);

    if (oldNumber.startsWith(tablePrefix)) {
      const sequencePart = oldNumber.slice(
        tablePrefix.length
      );

      const possibleSequence = Number(sequencePart);

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

/**
 * GET
 *
 * /api/orders
 *
 * или
 *
 * /api/orders?restaurantId=...
 */
async function handleGet(req, res, data) {
  const restaurantId = req.query?.restaurantId;

  let orders = Array.isArray(data.orders)
    ? data.orders
    : [];

  if (restaurantId) {
    orders = orders.filter(
      (order) =>
        order.restaurantId === restaurantId
    );
  }

  return sendJson(res, 200, {
    ok: true,
    orders,
  });
}

/**
 * POST
 *
 * Создание нового заказа.
 */
async function handlePost(req, res, data) {
  const body = req.body || {};

  /*
   * Проверяем ресторан.
   */
  if (!body.restaurantId) {
    return sendJson(res, 400, {
      ok: false,
      error: "restaurantId is required",
    });
  }

  /*
   * Проверяем стол.
   */
  if (!body.tableId) {
    return sendJson(res, 400, {
      ok: false,
      error: "tableId is required",
    });
  }

  /*
   * В заказе должно быть хотя бы одно блюдо.
   */
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

  const now = new Date();

  /*
   * Определяем номер стола.
   */
  const tableNumber = getTableNumber(body);

  /*
   * Определяем порядковый номер заказа
   * за сегодня на этом столе.
   */
  const dailySequence =
    getNextOrderSequence(
      data.orders,
      body.restaurantId,
      tableNumber,
      now
    );

  /*
   * Формируем номер:
   *
   * Стол 1 + заказ 1 = 11
   * Стол 1 + заказ 2 = 12
   * Стол 2 + заказ 1 = 21
   * Стол 2 + заказ 3 = 23
   *
   * Если последовательность станет большой:
   *
   * Стол 1 + заказ 10 = 110
   * Стол 1 + заказ 99 = 199
   * Стол 12 + заказ 3 = 123
   */
  const orderNumber = Number(
    `${tableNumber}${dailySequence}`
  );

  /*
   * Создаём заказ.
   *
   * Сохраняем body целиком, чтобы не потерять
   * существующие поля, которые уже использует FESTO.
   */
  const order = {
    ...body,

    /*
     * Если frontend уже передал id —
     * сохраняем его.
     *
     * Если нет — генерируем.
     */
    id:
      body.id ||
      `order_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    /*
     * Номер заказа для кухни / клиента.
     */
    number: orderNumber,

    /*
     * Номер заказа внутри текущего дня
     * для конкретного стола.
     */
    dailySequence,

    /*
     * Дата заказа.
     *
     * На следующий день sequence начинается
     * снова с 1.
     */
    orderDate: getCalendarDate(now),

    /*
     * Явно сохраняем номер стола.
     */
    tableNumber,

    /*
     * Если frontend передал createdAt —
     * сохраняем его.
     *
     * Если нет — ставим серверное время.
     */
    createdAt:
      body.createdAt ||
      now.toISOString(),

    /*
     * Новый заказ по умолчанию.
     */
    status:
      body.status ||
      "new",
  };

  /*
   * Добавляем заказ в существующие данные.
   */
  data.orders.push(order);

  /*
   * Сохраняем всё обратно в Redis.
   */
  await saveData(data);

  /*
   * Возвращаем созданный заказ.
   */
  return sendJson(res, 201, {
    ok: true,
    order,
  });
}

export default async function handler(req, res) {
  try {
    /*
     * Получаем актуальные данные FESTO из Redis.
     */
    const data = await getData();

    /*
     * Защита от ситуации, когда orders отсутствует.
     */
    if (!Array.isArray(data.orders)) {
      data.orders = [];
    }

    /*
     * GET — получение заказов.
     */
    if (req.method === "GET") {
      return handleGet(
        req,
        res,
        data
      );
    }

    /*
     * POST — создание заказа.
     */
    if (req.method === "POST") {
      return handlePost(
        req,
        res,
        data
      );
    }

    /*
     * Остальные HTTP-методы здесь
     * не используются.
     */
    return sendJson(res, 405, {
      ok: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error(
      "FESTO orders API error:",
      error
    );

    return sendJson(res, 500, {
      ok: false,
      error:
        error?.message ||
        "Internal server error",
    });
  }
}