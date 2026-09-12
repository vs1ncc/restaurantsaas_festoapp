import { getData } from "../../../../lib/redis.js";

function sendJson(res, status, data) {
  res.status(status).json(data);
}

export default async function handler(req, res) {
  try {
    /*
     * Публичное меню только для GET-запроса.
     */
    if (req.method !== "GET") {
      return sendJson(res, 405, {
        ok: false,
        error: "Method not allowed",
      });
    }

    /*
     * Получаем параметры из URL.
     *
     * Пример:
     *
     * /api/public-menu/restaurant_123/table_1
     */
    const restaurantId = req.query?.restaurantId;
    const tableId = req.query?.tableId;

    if (!restaurantId) {
      return sendJson(res, 400, {
        ok: false,
        error: "restaurantId is required",
      });
    }

    if (!tableId) {
      return sendJson(res, 400, {
        ok: false,
        error: "tableId is required",
      });
    }

    /*
     * Загружаем актуальные данные FESTO из Redis.
     */
    const data = await getData();

    const restaurants = Array.isArray(data.restaurants)
      ? data.restaurants
      : [];

    const categories = Array.isArray(data.categories)
      ? data.categories
      : [];

    const dishes = Array.isArray(data.dishes)
      ? data.dishes
      : [];

    const tables = Array.isArray(data.tables)
      ? data.tables
      : [];

    /*
     * Ищем ресторан.
     */
    const restaurant = restaurants.find(
      (item) => String(item.id) === String(restaurantId)
    );

    if (!restaurant) {
      return sendJson(res, 404, {
        ok: false,
        error: "Restaurant not found",
      });
    }

    /*
     * Ищем стол.
     */
    const table = tables.find(
      (item) =>
        String(item.id) === String(tableId) &&
        String(item.restaurantId) === String(restaurantId)
    );

    if (!table) {
      return sendJson(res, 404, {
        ok: false,
        error: "Table not found",
      });
    }

    /*
     * Берём только категории данного ресторана.
     */
    const restaurantCategories = categories.filter(
      (category) =>
        String(category.restaurantId) === String(restaurantId)
    );

    /*
     * Берём только блюда данного ресторана.
     *
     * Дополнительно оставляем только активные блюда,
     * если поле active существует.
     *
     * Это позволяет не показывать клиенту отключённые
     * позиции меню.
     */
    const restaurantDishes = dishes.filter((dish) => {
      if (
        String(dish.restaurantId) !==
        String(restaurantId)
      ) {
        return false;
      }

      /*
       * Если active явно false —
       * блюдо не показываем.
       *
       * Если active отсутствует —
       * считаем блюдо активным для совместимости
       * со старой структурой данных.
       */
      if (dish.active === false) {
        return false;
      }

      return true;
    });

    /*
     * Возвращаем только публичные данные,
     * необходимые клиентскому меню.
     *
     * Важно:
     * сюда НЕ передаём пароль, настройки входа
     * и другие административные данные.
     */
    return sendJson(res, 200, {
      ok: true,

      restaurant: {
        id: restaurant.id,
        name:
          restaurant.name ||
          restaurant.title ||
          "Ресторан",

        /*
         * Логотип используется в клиентском меню.
         */
        logo: restaurant.logo || null,

        /*
         * Дополнительные публичные поля.
         * Они не обязательны, но сохраняют совместимость
         * с уже существующей структурой FESTO.
         */
        address: restaurant.address || "",
        phone: restaurant.phone || "",
      },

      table: {
        id: table.id,

        /*
         * Номер стола.
         */
        number:
          table.number ??
          table.tableNumber ??
          null,

        /*
         * Название стола.
         */
        name:
          table.name ||
          table.title ||
          (
            table.number !== undefined &&
            table.number !== null
              ? `Стол ${table.number}`
              : "Стол"
          ),
      },

      /*
       * Категории меню.
       */
      categories: restaurantCategories,

      /*
       * Блюда меню.
       */
      dishes: restaurantDishes,
    });
  } catch (error) {
    console.error(
      "FESTO public menu API error:",
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