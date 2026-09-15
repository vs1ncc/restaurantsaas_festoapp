import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./index.css";

const ADMIN_EMAIL = "yosoycastello@gmail.com";
const TELEGRAM_MINI_APP_URL = "https://restaurantsaas-festoapp1-pi.vercel.app/";
const ADMIN_PASSWORD = "admin";

const STORAGE = {
  restaurants: "festo_restaurants",
  categories: "festo_categories",
  dishes: "festo_dishes",
  tables: "festo_tables",
  orders: "festo_orders",
  invoices: "festo_invoices",
  qrStands: "festo_qr_stands",
  reportDrafts: "festo_report_drafts",
  session: "festo_session",
};

const DEFAULT_RESTAURANT = {
  id: "demo-restaurant",
  legalName: "ООО «Фесто»",
  inn: "0000000000",
  phone: "+7 900 000-00-00",
  name: "Demo Restaurant",
  address: "Адрес ресторана",
  accent: "#6C4BF4",
  login: "director",
  password: "123456",
  license: "FESTO-DEMO-2026",
};

const DEFAULT_CATEGORIES = [
  {
    id: "cat-hot",
    restaurantId: "demo-restaurant",
    name: "Основные блюда",
    sort: 1,
  },
  {
    id: "cat-snacks",
    restaurantId: "demo-restaurant",
    name: "Закуски",
    sort: 2,
  },
  {
    id: "cat-drinks",
    restaurantId: "demo-restaurant",
    name: "Напитки",
    sort: 3,
  },
];

const DEFAULT_DISHES = [
  {
    id: "dish-1",
    restaurantId: "demo-restaurant",
    categoryId: "cat-hot",
    name: "Паста Карбонара",
    description: "Паста, бекон, сливочный соус и пармезан",
    price: 690,
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    active: true,
  },
  {
    id: "dish-2",
    restaurantId: "demo-restaurant",
    categoryId: "cat-hot",
    name: "Стейк с овощами",
    description: "Сочный стейк с сезонными овощами",
    price: 1490,
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80",
    active: true,
  },
  {
    id: "dish-3",
    restaurantId: "demo-restaurant",
    categoryId: "cat-snacks",
    name: "Брускетта",
    description: "Хрустящий хлеб, томаты, зелень и оливковое масло",
    price: 420,
    image:
      "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=900&q=80",
    active: true,
  },
  {
    id: "dish-4",
    restaurantId: "demo-restaurant",
    categoryId: "cat-snacks",
    name: "Сырная тарелка",
    description: "Ассорти европейских сыров",
    price: 850,
    image:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=900&q=80",
    active: true,
  },
  {
    id: "dish-5",
    restaurantId: "demo-restaurant",
    categoryId: "cat-drinks",
    name: "Лимонад",
    description: "Домашний лимонад с цитрусами",
    price: 290,
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
    active: true,
  },
];

const DEFAULT_TABLES = [
  {
    id: "table-1",
    restaurantId: "demo-restaurant",
    name: "Столик 1",
    number: "1",
  },
  {
    id: "table-2",
    restaurantId: "demo-restaurant",
    name: "Столик 2",
    number: "2",
  },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("FESTO localStorage write failed:", error);
  }
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function money(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "F";
}

function Icon({ name, size = 18, strokeWidth = 1.8, className = "" }) {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></>,
    restaurant: <><path d="M7 3v7"/><path d="M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3"/><path d="M7 10v11"/><path d="m14 4 7 7"/><path d="M16.5 2.8c1.8 1.8 1.8 4.7 0 6.5L14 11.8"/><path d="m14 11 7 10"/></>,
    license: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20H10v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4v-2h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 7.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V6h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
    menu: <><path d="M5 6h14M5 12h14M5 18h14"/></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M9 9v11M15 9v11"/></>,
    orders: <><path d="M6 3h12l2 4v14H4V7l2-4Z"/><path d="M4 8h16M8 13h8M8 17h5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    edit: <><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5a2.5 2.5 0 0 0-3.5-3.5L4 16.5Z"/><path d="m14 7 3 3"/></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6"/><path d="M7 7l1 14h8l1-14M9 7l1-3h4l1 3"/></>,
    eye: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    eyeOff: <><path d="m3 3 18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6.1 0 9.5 6 9.5 6a15 15 0 0 1-3.1 3.6M6.3 6.3C3.9 8.2 2.5 12 2.5 12s3.4 6 9.5 6c1.2 0 2.3-.2 3.3-.6"/></>,
    upload: <><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 14v6h14v-6"/></>,
    spark: <><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    check: <><path d="m5 12 4.2 4.2L19 6.5"/></>,
    file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 4.5-4 3 2.5 2.5-2 4 3.5"/></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    profile: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
    bank: <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M7 14h.01M11 14h6"/></>,
    chart: <><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/></>,
    qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2"/></>,
  };
  return <svg className={`festo-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.file}</svg>;
}

const FESTO_API_BASE = (typeof window !== "undefined" && window.__FESTO_API_BASE__) || "";

async function festoApi(path, options = {}) {
  const response = await fetch(`${FESTO_API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`FESTO API ${response.status}`);
  return response.json();
}

function customerUrl(tableId, restaurantId) {
  // Короткий hash-URL: iPhone легко считывает такой QR, а SPA-хостингу
  // не нужен отдельный server rewrite для /menu/...
  const path = window.location.pathname || "/";
  const basePath = path.endsWith("/") ? path : path.slice(0, path.lastIndexOf("/") + 1) || "/";
  return `${window.location.origin}${basePath}#/menu/${encodeURIComponent(restaurantId)}/${encodeURIComponent(tableId)}`;
}

function getPublicMenuSnapshot(tableId, restaurantId) {
  const restaurants = readStorage(STORAGE.restaurants, [DEFAULT_RESTAURANT]);
  const categories = readStorage(STORAGE.categories, DEFAULT_CATEGORIES);
  const dishes = readStorage(STORAGE.dishes, DEFAULT_DISHES);
  const tables = readStorage(STORAGE.tables, DEFAULT_TABLES);
  const restaurant = restaurants.find((item) => item.id === restaurantId);
  const table = tables.find((item) => item.id === tableId && item.restaurantId === restaurantId);
  if (!restaurant || !table) return null;
  return {
    version: 3,
    restaurant: { id: restaurant.id, name: restaurant.name, accent: restaurant.accent || "#6C4BF4" },
    table: { id: table.id, name: table.name, number: table.number, restaurantId: table.restaurantId },
    categories: categories.filter((item) => item.restaurantId === restaurantId).map(({ id, name, sort }) => ({ id, name, sort })),
    dishes: dishes.filter((item) => item.restaurantId === restaurantId && item.active !== false).map((item) => ({
      id: item.id, categoryId: item.categoryId, name: item.name, description: item.description || "", price: Number(item.price || 0),
      image: String(item.image || "").startsWith("http") ? item.image : "",
    })),
  };
}

/* -------------------------------------------------------
   AUTH
------------------------------------------------------- */

function Auth({ restaurants, onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    setError("");

    const normalized = login.trim().toLowerCase();

    // Главное правило:
    // главный администратор ВСЕГДА определяется по email.
    // Он никогда не становится директором ресторана.
    if (normalized === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin({
        role: "admin",
        email: ADMIN_EMAIL,
      });
      return;
    }

    const restaurant = restaurants.find(
      (item) =>
        item.login?.trim().toLowerCase() === normalized &&
        item.password === password
    );

    if (restaurant) {
      onLogin({
        role: "director",
        restaurantId: restaurant.id,
        login: restaurant.login,
      });
      return;
    }

    setError("Неверный логин или пароль");
  }

  return (
    <div className="auth-page">
      <div className="auth-glow glow-one" />
      <div className="auth-glow glow-two" />

      <form className="auth-card" onSubmit={submit}>
        <img
          className="login-festo-logo-image"
          src="/festo-logo.png"
          alt="FESTO"
        />

        <h1>Добро пожаловать</h1>

        <p className="auth-description">
          Войдите в систему управления рестораном
        </p>

        {error && <div className="error">{error}</div>}

        <div className="input-group">
          <label>Логин</label>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Введите логин"
            autoComplete="username"
          />
        </div>

        <div className="input-group">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            autoComplete="current-password"
          />
        </div>

        <button className="login-button" type="submit">
          Войти
        </button>
      </form>
    </div>
  );
}


/* -------------------------------------------------------
   LICENSE AGREEMENT / TRIAL ACCESS
------------------------------------------------------- */

const TRIAL_HOURS = 5;
const SUBSCRIPTION_PRICE = 5000;
const DEFAULT_PAYMENT_REQUISITES = "+7 925 569 07-37 · Даниэла Альбертовна Х. · Сбер Банк · по СБП";

function LicenseAgreementGate({ restaurant, onAccept, onLogout }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="agreement-page">
      <div className="agreement-card agreement-card-wide">
        <div className="logo">F</div>
        <div className="eyebrow">ПЕРВЫЙ ВХОД · FESTO</div>
        <h1>Лицензионное соглашение</h1>
        <p className="agreement-lead">Перед началом работы ознакомьтесь с условиями использования программного обеспечения FESTO.</p>
        <div className="agreement-parties">
          <div><span>Лицензиат</span><strong>ООО «Фесто»</strong><small>владелец лицензии</small></div>
          <div><span>Лицензиар</span><strong>{restaurant.legalName || restaurant.name}</strong><small>ресторан, на который создан аккаунт</small></div>
        </div>
        <div className="agreement-scroll">
          <h3>1. Общие положения</h3>
          <p>Настоящее лицензионное соглашение регулирует предоставление права использования программного обеспечения FESTO для автоматизации работы ресторана. Лицензиаром по настоящему соглашению является ООО «Фесто», а Лицензиатом — юридическое лицо или индивидуальный предприниматель, указанный в учетной записи ресторана: <strong>{restaurant.legalName || restaurant.name}</strong>.</p>
          <h3>2. Предмет лицензии</h3>
          <p>Лицензиар предоставляет Лицензиату неисключительное, непередаваемое право использовать FESTO для управления меню, QR-меню, столами, заказами, отчетностью, настройками ресторана и иными доступными в аккаунте функциями. Передача исходного кода, перепродажа программы или предоставление доступа третьим лицам вне согласованного круга пользователей не разрешаются.</p>
          <h3>3. Учетная запись и безопасность</h3>
          <p>Лицензиат обязан хранить логин и пароль в тайне, своевременно обновлять данные и незамедлительно сообщать об утрате контроля над учетной записью. Действия, совершенные с использованием учетной записи, считаются совершенными Лицензиатом до момента уведомления Лицензиара об ее компрометации.</p>
          <h3>4. Пробный период</h3>
          <p>При первичном подключении предоставляется пробный доступ продолжительностью 5 часов с момента первого входа. В течение пробного периода функциональность предоставляется для ознакомления. По окончании пробного периода доступ к кабинету может быть ограничен до подтверждения оплаты лицензии.</p>
          <h3>5. Стоимость и порядок оплаты</h3>
          <p>Стоимость подключения нового ресторана составляет <strong>{money(SUBSCRIPTION_PRICE)}</strong>. Оплата производится банковским переводом по реквизитам, указанным в счете. После загрузки подтверждения платежа счет передается администратору FESTO на ручную проверку.</p>
          <h3>6. Бессрочная лицензия после подтверждения оплаты</h3>
          <p>После подтверждения администратором полной оплаты счета на подключение ресторана пробный период прекращается, а в учетной записи устанавливается статус бессрочной лицензии. Если платеж отклонен, статус лицензии не изменяется до получения и подтверждения корректного платежа.</p>
          <h3>7. Интеллектуальные права</h3>
          <p>Исключительные права на программное обеспечение FESTO, его интерфейс, код, товарные обозначения и документацию принадлежат соответствующим правообладателям. Настоящее соглашение не передает Лицензиату исключительные права на программу.</p>
          <h3>8. Данные ресторана и ответственность пользователя</h3>
          <p>Лицензиат самостоятельно отвечает за законность, достоверность и актуальность размещаемых в FESTO сведений, включая цены, состав блюд, изображения, реквизиты и сведения о заказах. Лицензиат также обязан иметь необходимые права на загружаемые фотографии, тексты и иные материалы.</p>
          <h3>9. Доступность и техническая поддержка</h3>
          <p>Лицензиар принимает разумные меры для поддержания работоспособности сервиса, однако не гарантирует бесперебойную работу при сбоях связи, оборудования, сторонней инфраструктуры или обстоятельствах непреодолимой силы. Плановые технические работы могут временно ограничивать доступ.</p>
          <h3>10. Ограничение ответственности</h3>
          <p>FESTO является программным инструментом автоматизации и не заменяет бухгалтерский, юридический или иной профессиональный контроль. Лицензиат самостоятельно проверяет корректность цен, заказов, платежей, отчетов и других критически важных данных перед их использованием.</p>
          <h3>11. Срок действия и прекращение</h3>
          <p>Соглашение действует с момента принятия и, при подтвержденной оплате лицензии, без ограничения срока, если иное не предусмотрено применимым законодательством или отдельным письменным соглашением сторон. При существенном нарушении условий доступ может быть приостановлен после уведомления Лицензиата, если нарушение не устранено в разумный срок.</p>
          <h3>12. Изменения соглашения</h3>
          <p>Изменения условий публикуются в интерфейсе FESTO или доводятся до Лицензиата иным доступным способом. Изменения, ухудшающие положение действующего Лицензиата, применяются с учетом требований законодательства и порядка уведомления.</p>
          <h3>13. Заключительные положения</h3>
          <p>Нажатие кнопки «Далее» после установки отметки означает, что пользователь ознакомился с текстом соглашения, понял его условия и действует от имени Лицензиата либо имеет полномочия принять соглашение. Если пользователь не согласен с условиями, он должен выйти из аккаунта и не использовать сервис.</p>
          <p className="agreement-legal-note"><strong>Важно:</strong> этот текст является рабочим шаблоном пользовательского лицензионного соглашения для интерфейса FESTO. Перед коммерческим запуском его следует проверить и при необходимости адаптировать под реквизиты ООО «Фесто», выбранную юрисдикцию, налоговый режим и требования законодательства о персональных данных.</p>
        </div>
        <label className="agreement-check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>Я прочитал(а) и согласен(на) с лицензионным соглашением.</span>
        </label>
        <div className="agreement-actions">
          <button className="secondary-button" type="button" onClick={onLogout}>Выйти</button>
          <button className="primary-button" type="button" disabled={!accepted} onClick={onAccept}>Далее</button>
        </div>
      </div>
    </div>
  );
}

function TrialExpiredGate({ restaurant, invoices, setInvoices, onLogout }) {
  return (
    <div className="trial-expired-page">
      <div className="trial-expired-head">
        <div className="logo">F</div>
        <div><div className="eyebrow">ПРОБНЫЙ ДОСТУП ЗАВЕРШЕН</div><h1>Оплатите FESTO, чтобы продолжить</h1><p>{restaurant.name} · пробный период 5 часов закончился.</p></div>
        <button className="secondary-button" onClick={onLogout}><Icon name="logout" size={17}/>Выйти</button>
      </div>
      <div className="trial-expired-note"><strong>Счет за программное обеспечение — {money(SUBSCRIPTION_PRICE)}</strong><span>Оплата только банковским переводом. После перевода прикрепите чек в счете.</span></div>
      <InvoicesPage restaurant={restaurant} invoices={invoices} setInvoices={setInvoices} onBack={null} embedded />
    </div>
  );
}

/* -------------------------------------------------------
   ADMIN
------------------------------------------------------- */

function AdminApp({
  restaurants,
  setRestaurants,
  categories,
  dishes,
  tables,
  orders,
  setTables,
  setOrders,
  invoices,
  setInvoices,
  onLogout,
}) {
  const [page, setPage] = useState("dashboard");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const activeRestaurant =
    restaurants.find((r) => r.id === selectedRestaurant) || null;

  // Navigation between sections must always start at the top of the desktop page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  function deleteRestaurant(id) {
    if (id === "demo-restaurant") {
      alert("Демо-ресторан нельзя удалить.");
      return;
    }

    const restaurant = restaurants.find((r) => r.id === id);

    if (!restaurant) return;

    if (
      !window.confirm(
        `Удалить ресторан «${restaurant.name}»?\n\nВсе связанные меню, столы и заказы также будут удалены.`
      )
    ) {
      return;
    }

    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    setTables((prev) => prev.filter((t) => t.restaurantId !== id));
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        role="admin"
        email={ADMIN_EMAIL}
        onLogout={onLogout}
      />

      <main className="main-content">
        <Topbar
          title={getAdminPageTitle(page)}
          name="Администратор"
          subtitle={ADMIN_EMAIL}
        />

        {page === "dashboard" && (
          <AdminDashboard
            restaurants={restaurants}
            categories={categories}
            dishes={dishes}
            tables={tables}
            orders={orders}
            onCreate={() => setShowCreate(true)}
            onRestaurants={() => setPage("restaurants")}
          />
        )}

        {page === "restaurants" && (
          <RestaurantsPage
            restaurants={restaurants}
            onCreate={() => setShowCreate(true)}
            onSelect={(id) => {
              setSelectedRestaurant(id);
              setPage("restaurant-details");
            }}
            onDelete={deleteRestaurant}
          />
        )}

        {page === "licenses" && (
          <LicensesPage restaurants={restaurants} />
        )}

        {page === "restaurant-details" && activeRestaurant && (
          <RestaurantDetails
            restaurant={activeRestaurant}
            categories={categories}
            dishes={dishes}
            tables={tables}
            orders={orders}
            onBack={() => setPage("restaurants")}
            onUpdate={(updated) => {
              setRestaurants((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r))
              );
            }}
          />
        )}

        {page === "profile" && (
          <AdminProfilePage
            restaurants={restaurants}
            setRestaurants={setRestaurants}
            invoices={invoices}
            setInvoices={setInvoices}
            onLogout={onLogout}
          />
        )}

        {page === "settings" && (
          <SettingsPage
            title="Настройки"
            subtitle="Основные параметры приложения Festo"
            email={ADMIN_EMAIL}
          />
        )}

        {page === "telegram" && (
          <TelegramIntegrationPage />
        )}

        {showCreate && (
          <CreateRestaurantModal
            restaurants={restaurants}
            onClose={() => setShowCreate(false)}
            onCreate={(restaurant) => {
              setRestaurants((prev) => [...prev, restaurant]);
              const invoice = {
                id: uid("invoice"),
                number: `F-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                restaurantId: restaurant.id,
                title: "Лицензия и программное обеспечение FESTO",
                amount: SUBSCRIPTION_PRICE,
                description: "Оплата программного обеспечения FESTO после пробного доступа.",
                requisites: DEFAULT_PAYMENT_REQUISITES,
                status: "pending_payment",
                type: "subscription",
                createdAt: new Date().toISOString(),
              };
              setInvoices((prev) => [invoice, ...prev]);
              setShowCreate(false);
            }}
          />
        )}
      </main>

      <MobileBar
        page={page}
        setPage={setPage}
        role="admin"
      />
    </div>
  );
}

/* -------------------------------------------------------
   DIRECTOR
------------------------------------------------------- */

function DirectorApp({
  restaurant,
  restaurants,
  categories,
  setCategories,
  dishes,
  setDishes,
  tables,
  setTables,
  orders,
  setOrders,
  setRestaurants,
  invoices,
  setInvoices,
  onLogout,
}) {
  const [page, setPage] = useState("dashboard");

  // Reset the document scroll whenever a desktop cabinet section changes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  function openLiveOrders() {
    const url = `${window.location.origin}${window.location.pathname}?liveOrders=${encodeURIComponent(
      restaurant.id
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!restaurant) {
    return (
      <Auth
        restaurants={[]}
        onLogin={() => {}}
      />
    );
  }

  const restaurantDishes = dishes.filter(
    (d) => d.restaurantId === restaurant.id
  );

  const restaurantCategories = categories.filter(
    (c) => c.restaurantId === restaurant.id
  );

  const restaurantTables = tables.filter(
    (t) => t.restaurantId === restaurant.id
  );

  const restaurantOrders = orders.filter(
    (o) => o.restaurantId === restaurant.id
  );

  return (
    <div
      className="app-shell"
      style={{
        "--accent": restaurant.accent || "#6C4BF4",
        "--ui-accent": restaurant.accent || "#6C4BF4",
      }}
    >
      <Sidebar
        page={page}
        setPage={setPage}
        role="director"
        restaurant={restaurant}
        onLogout={onLogout}
      />

      <main className="main-content">
        <Topbar
          title={getDirectorPageTitle(page)}
          name={restaurant.name}
          subtitle="Директор ресторана"
          liveCount={restaurantOrders.length}
          onOpenLiveOrders={openLiveOrders}
        />

        {page === "dashboard" && (
          <DirectorDashboard
            restaurant={restaurant}
            dishes={restaurantDishes}
            categories={restaurantCategories}
            tables={restaurantTables}
            orders={restaurantOrders}
            onPage={setPage}
          />
        )}

        {page === "menu" && (
          <MenuManager
            restaurant={restaurant}
            categories={restaurantCategories}
            dishes={restaurantDishes}
            setCategories={setCategories}
            setDishes={setDishes}
          />
        )}

        {page === "tables" && (
          <TablesManager
            restaurant={restaurant}
            tables={restaurantTables}
            setTables={setTables}
          />
        )}

        {page === "profile" && (
          <ProfilePage
            restaurant={restaurant}
            orders={restaurantOrders}
            setOrders={setOrders}
            tables={restaurantTables}
            invoices={invoices}
            setInvoices={setInvoices}
            onLogout={onLogout}
          />
        )}

        {page === "settings" && (
          <RestaurantSettings
            restaurant={restaurant}
            restaurants={restaurants}
            setRestaurants={setRestaurants}
          />
        )}
      </main>

      <MobileBar
        page={page}
        setPage={setPage}
        role="director"
      />
    </div>
  );
}

/* -------------------------------------------------------
   SIDEBAR
------------------------------------------------------- */

function Sidebar({ page, setPage, role, restaurant, onLogout, email }) {
  const adminItems = [
    { id: "dashboard", icon: "home", label: "Главная" },
    { id: "restaurants", icon: "restaurant", label: "Рестораны" },
    { id: "licenses", icon: "license", label: "Лицензии" },
    { id: "profile", icon: "profile", label: "Профиль" },
    { id: "settings", icon: "settings", label: "Настройки" },
    ...(email === ADMIN_EMAIL ? [{ id: "telegram", icon: "send", label: "Telegram" }] : []),
  ];
  const directorItems = [
    { id: "dashboard", icon: "home", label: "Главная" },
    { id: "menu", icon: "menu", label: "Меню" },
    { id: "tables", icon: "table", label: "Столы" },
    { id: "profile", icon: "profile", label: "Профиль" },
    { id: "settings", icon: "settings", label: "Настройки" },
  ];
  const items = role === "admin" ? adminItems : directorItems;
  return (
    <aside className="sidebar">
      <div className="brand"><div className="brand-logo">F</div><span>FESTO</span></div>
      <nav>
        {items.map((item) => (
          <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {restaurant && <div className="sidebar-restaurant"><strong>{restaurant.name}</strong><span>Режим директора</span></div>}
      <button className="logout" onClick={onLogout}><Icon name="logout" size={17} />Выйти</button>
    </aside>
  );
}

/* -------------------------------------------------------
   TOPBAR
------------------------------------------------------- */

function Topbar({ title, name, subtitle, liveCount = 0, onOpenLiveOrders }) {
  return (
    <div className="topbar">
      <h2>{title}</h2>

      <div className="topbar-actions">
        {onOpenLiveOrders && (
          <button
            className="live-orders-button"
            onClick={onOpenLiveOrders}
            title="Открыть Live-заказы в новой вкладке"
          >
            <span className="live-dot" />
            LIVE ЗАКАЗЫ
            <span className="live-arrow"><Icon name="arrow" size={15} /></span>
          </button>
        )}

        <div className="profile">
        <div className="avatar">{getInitials(name)}</div>

        <div>
          <strong>{name}</strong>
          <span>{subtitle}</span>
        </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   ADMIN DASHBOARD
------------------------------------------------------- */

function AdminDashboard({
  restaurants,
  categories,
  dishes,
  tables,
  orders,
  onCreate,
  onRestaurants,
}) {
  const revenue = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  return (
    <>
      <div className="welcome-card">
        <div>
          <div className="card-label">FESTO RESTAURANT SYSTEM</div>

          <h1>Управление ресторанами</h1>

          <p>
            Управляйте ресторанами, лицензиями и ресторанной
            инфраструктурой из одного места.
          </p>

          <button className="primary-button" onClick={onCreate}>
            + Добавить ресторан
          </button>
        </div>

      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span>РЕСТОРАНЫ</span>
          <strong>{restaurants.length}</strong>
          <p>Подключено</p>
        </div>

        <div className="dashboard-card">
          <span>МЕНЮ</span>
          <strong>{dishes.length}</strong>
          <p>Блюд в системе</p>
        </div>

        <div className="dashboard-card">
          <span>ЗАКАЗЫ</span>
          <strong>{orders.length}</strong>
          <p>{money(revenue)} оборот</p>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <div className="page-heading">
          <div>
            <div className="eyebrow">СИСТЕМА</div>
            <h1>Последние рестораны</h1>
            <p>Подключённые точки Festo</p>
          </div>

          <button className="secondary-button" onClick={onRestaurants}>
            Все рестораны
          </button>
        </div>

        <div className="restaurant-grid">
          {restaurants.slice(0, 3).map((restaurant) => (
            <div className="restaurant-card" key={restaurant.id}>
              <div
                className="restaurant-accent"
                style={{
                  background: restaurant.accent || "#111",
                }}
              />

              <div className="restaurant-card-body">
                <div className="restaurant-icon">
                  {getInitials(restaurant.name)}
                </div>

                <div className="restaurant-info">
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.address}</p>
                  <span>ИНН: {restaurant.inn}</span>

                  <div className="license-badge">
                    Лицензия активна
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------
   DIRECTOR DASHBOARD
------------------------------------------------------- */

function DirectorDashboard({
  restaurant,
  dishes,
  categories,
  tables,
  orders,
  onPage,
}) {
  const revenue = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  return (
    <>
      <div className="director-hero">
        <div>
          <div className="card-label">ПАНЕЛЬ РЕСТОРАНА</div>

          <h1>{restaurant.name}</h1>

          <p>
            Управляйте меню, столами, QR-кодами и заказами
            вашего ресторана.
          </p>

          <button
            className="primary-button"
            onClick={() => onPage("menu")}
            style={{
              background: "white",
              color: "#111",
              marginTop: 24,
            }}
          >
            Открыть меню
          </button>
        </div>

      </div>

      <div className="dashboard-grid">
        <div
          className="dashboard-card"
          onClick={() => onPage("menu")}
          style={{ cursor: "pointer" }}
        >
          <span>БЛЮДА</span>
          <strong>{dishes.length}</strong>
          <p>{categories.length} категории</p>
        </div>

        <div
          className="dashboard-card"
          onClick={() => onPage("tables")}
          style={{ cursor: "pointer" }}
        >
          <span>СТОЛЫ</span>
          <strong>{tables.length}</strong>
          <p>QR-коды готовы</p>
        </div>

        <div
          className="dashboard-card"
          onClick={() => onPage("orders")}
          style={{ cursor: "pointer" }}
        >
          <span>ЗАКАЗЫ</span>
          <strong>{orders.length}</strong>
          <p>{money(revenue)} сумма</p>
        </div>
      </div>

    </>
  );
}

/* -------------------------------------------------------
   RESTAURANTS
------------------------------------------------------- */

function RestaurantsPage({
  restaurants,
  onCreate,
  onSelect,
  onDelete,
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FESTO</div>
          <h1>Рестораны</h1>
          <p>Управление подключёнными ресторанами</p>
        </div>

        <button className="primary-button" onClick={onCreate}>
          + Добавить ресторан
        </button>
      </div>

      {restaurants.length === 0 ? (
        <EmptyState
          icon="R"
          title="Ресторанов пока нет"
          text="Создайте первый ресторан, чтобы начать работу."
          button="Добавить ресторан"
          onClick={onCreate}
        />
      ) : (
        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <div
              className="restaurant-card"
              key={restaurant.id}
              onClick={() => onSelect(restaurant.id)}
            >
              <div
                className="restaurant-accent"
                style={{
                  background: restaurant.accent || "#111",
                }}
              />

              <div className="restaurant-card-body">
                <div className="restaurant-icon">
                  {getInitials(restaurant.name)}
                </div>

                <div className="restaurant-info">
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.address}</p>

                  <span>
                    {restaurant.legalName}
                  </span>

                  <span>
                    ИНН: {restaurant.inn}
                  </span>

                  <div className="license-badge">
                    Лицензия бессрочная
                  </div>
                </div>

                {restaurant.id !== "demo-restaurant" && (
                  <button
                    className="card-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(restaurant.id);
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------
   LICENSES
------------------------------------------------------- */

function LicensesPage({ restaurants }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FESTO</div>
          <h1>Лицензии</h1>
          <p>Выданные лицензии ресторанам</p>
        </div>
      </div>

      {restaurants.length === 0 ? (
        <EmptyState
          icon="L"
          title="Лицензий пока нет"
          text="Лицензия появится после создания ресторана."
        />
      ) : (
        <div className="license-list">
          {restaurants.map((restaurant) => (
            <div className="license-card" key={restaurant.id}>
              <div className="license-main">
                <div
                  className="license-icon"
                  style={{
                    background:
                      restaurant.accent || "#111",
                  }}
                >
                  F
                </div>

                <div>
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.legalName}</p>

                  <div className="license-key">
                    {restaurant.license}
                  </div>
                </div>
              </div>

              <div className="license-data">
                <div>
                  <span>СТАТУС</span>
                  <strong style={{ color: "#367346" }}>
                    Активна
                  </strong>
                </div>

                <div>
                  <span>СРОК</span>
                  <strong>Бессрочно</strong>
                </div>

                <div>
                  <span>ЛОГИН</span>
                  <strong>{restaurant.login}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------
   CREATE RESTAURANT
------------------------------------------------------- */

function CreateRestaurantModal({
  restaurants,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState({
    legalName: "",
    inn: "",
    phone: "",
    name: "",
    address: "",
    accent: "#6C4BF4",
  });

  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function generateLogin() {
    const base =
      form.name
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, "")
        .slice(0, 12) || "restaurant";

    let login = base;
    let index = 2;

    while (
      restaurants.some(
        (restaurant) =>
          restaurant.login?.toLowerCase() ===
          login.toLowerCase()
      )
    ) {
      login = `${base}${index}`;
      index += 1;
    }

    return login;
  }

  function submit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.legalName.trim() ||
      !form.inn.trim() ||
      !form.phone.trim() ||
      !form.name.trim() ||
      !form.address.trim()
    ) {
      setError("Заполните все обязательные поля.");
      return;
    }

    const login = generateLogin();

    const restaurant = {
      id: uid("restaurant"),
      legalName: form.legalName.trim(),
      inn: form.inn.trim(),
      phone: form.phone.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
      accent: form.accent,
      login,
      password: Math.random()
        .toString(36)
        .slice(-8),
      license: `FESTO-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`,
      licenseAcceptedAt: null,
      trialStartedAt: null,
      trialDurationHours: TRIAL_HOURS,
      subscriptionActive: false,
      subscriptionType: "trial",
    };

    onCreate(restaurant);
  }

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">НОВЫЙ РЕСТОРАН</div>
            <h2>Добавить ресторан</h2>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-section">
          <h3>Юридическая информация</h3>

          <div className="input-group">
            <label>Юридическое название *</label>
            <input
              value={form.legalName}
              onChange={(e) =>
                update("legalName", e.target.value)
              }
              placeholder="ООО «Название»"
            />
          </div>

          <div className="two-columns">
            <div className="input-group">
              <label>ИНН *</label>
              <input
                value={form.inn}
                onChange={(e) =>
                  update("inn", e.target.value)
                }
                placeholder="0000000000"
              />
            </div>

            <div className="input-group">
              <label>Телефон *</label>
              <input
                value={form.phone}
                onChange={(e) =>
                  update("phone", e.target.value)
                }
                placeholder="+7 900 000-00-00"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Ресторан</h3>

          <div className="input-group">
            <label>Название *</label>
            <input
              value={form.name}
              onChange={(e) =>
                update("name", e.target.value)
              }
              placeholder="Название ресторана"
            />
          </div>

          <div className="input-group">
            <label>Адрес *</label>
            <input
              value={form.address}
              onChange={(e) =>
                update("address", e.target.value)
              }
              placeholder="Адрес ресторана"
            />
          </div>

          <div className="color-row">
            <div>
              <label>Акцентный цвет</label>
              <p>Используется в интерфейсе ресторана</p>
            </div>

            <input
              type="color"
              className="color-input"
              value={form.accent}
              onChange={(e) =>
                update("accent", e.target.value)
              }
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Отмена
          </button>

          <button className="primary-button" type="submit">
            Создать ресторан
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------
   RESTAURANT DETAILS
------------------------------------------------------- */

function RestaurantDetails({
  restaurant,
  categories,
  dishes,
  tables,
  orders,
  onBack,
  onUpdate,
}) {
  const restaurantDishes = dishes.filter(
    (d) => d.restaurantId === restaurant.id
  );

  const restaurantTables = tables.filter(
    (t) => t.restaurantId === restaurant.id
  );

  const restaurantOrders = orders.filter(
    (o) => o.restaurantId === restaurant.id
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(restaurant);

  function save() {
    onUpdate(form);
    setEditing(false);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <button
            className="secondary-button"
            onClick={onBack}
            style={{ marginBottom: 15 }}
          >
            ← Назад
          </button>

          <div className="eyebrow">РЕСТОРАН</div>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.address}</p>
        </div>

        {!editing && (
          <button
            className="primary-button"
            onClick={() => setEditing(true)}
          >
            Редактировать
          </button>
        )}
      </div>

      {editing ? (
        <div className="settings-card">
          <h1>Редактирование</h1>

          <p>
            Измените данные ресторана.
          </p>

          <div className="details-edit">
            <h3>Название ресторана</h3>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div className="details-edit">
            <h3>Юридическое название</h3>
            <input
              value={form.legalName}
              onChange={(e) =>
                setForm({
                  ...form,
                  legalName: e.target.value,
                })
              }
            />
          </div>

          <div className="details-edit">
            <h3>Телефон</h3>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />
          </div>

          <div className="details-edit">
            <h3>Адрес</h3>
            <input
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
            />
          </div>

          <div className="details-edit">
            <h3>Акцентный цвет</h3>

            <input
              type="color"
              className="color-input"
              value={form.accent}
              onChange={(e) =>
                setForm({
                  ...form,
                  accent: e.target.value,
                })
              }
            />
          </div>

          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setForm(restaurant);
                setEditing(false);
              }}
            >
              Отмена
            </button>

            <button
              className="primary-button"
              onClick={save}
            >
              Сохранить
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="details-grid">
            <div className="details-block">
              <h3>Информация</h3>

              <DetailRow
                label="Юридическое название"
                value={restaurant.legalName}
              />

              <DetailRow
                label="ИНН"
                value={restaurant.inn}
              />

              <DetailRow
                label="Телефон"
                value={restaurant.phone}
              />

              <DetailRow
                label="Адрес"
                value={restaurant.address}
              />
            </div>

            <div className="details-block">
              <h3>Доступ</h3>

              <div className="credential">
                <span>ЛОГИН ДИРЕКТОРА</span>
                <strong>{restaurant.login}</strong>
              </div>

              <div className="credential">
                <span>ПАРОЛЬ</span>
                <strong>{restaurant.password}</strong>
              </div>

              <div className="credential">
                <span>ЛИЦЕНЗИЯ</span>
                <strong>{restaurant.license}</strong>
              </div>

              <div className="license-status">
                <span className="status-dot" />
                Лицензия активна
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <span>КАТЕГОРИИ</span>
              <strong>{categories.length}</strong>
            </div>

            <div className="dashboard-card">
              <span>БЛЮДА</span>
              <strong>{restaurantDishes.length}</strong>
            </div>

            <div className="dashboard-card">
              <span>СТОЛЫ</span>
              <strong>{restaurantTables.length}</strong>
            </div>
          </div>

          <div className="settings-card" style={{ marginTop: 20 }}>
            <h3>Заказы</h3>
            <p>
              Всего заказов ресторана:{" "}
              <strong>{restaurantOrders.length}</strong>
            </p>
          </div>
        </>
      )}
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SubpageHeader({ title, onBack }) {
  return (
    <div className="subpage-header">
      <button className="subpage-back" type="button" onClick={onBack} aria-label="Назад в меню">
        <Icon name="arrow" size={18} className="subpage-back-icon" />
        <span>Назад</span>
      </button>
      <div className="subpage-title">{title}</div>
    </div>
  );
}

/* -------------------------------------------------------
   MENU MANAGER
------------------------------------------------------- */

function MenuManager({ restaurant, categories, dishes, setCategories, setDishes }) {
  const [menuSubpage, setMenuSubpage] = useState(null);
  const [editingDish, setEditingDish] = useState(null);

  // Navigation inside the menu must always start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [menuSubpage]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const visibleCategories = [...categories].sort((a, b) => a.sort - b.sort);
  const visibleDishes = dishes.filter((dish) => {
    const categoryMatch = activeCategory === "all" || dish.categoryId === activeCategory;
    const query = search.trim().toLowerCase();
    const searchMatch = !query || [dish.name, dish.description, dish.ingredients].some((v) => String(v || "").toLowerCase().includes(query));
    return categoryMatch && searchMatch;
  });

  function deleteCategory(categoryId) {
    if (dishes.some((dish) => dish.categoryId === categoryId)) {
      alert("Сначала удалите или перенесите блюда из этой категории.");
      return;
    }
    setCategories((prev) => prev.filter((category) => category.id !== categoryId));
    if (activeCategory === categoryId) setActiveCategory("all");
  }
  function deleteDish(id) {
    if (!window.confirm("Удалить блюдо?")) return;
    setDishes((prev) => prev.filter((dish) => dish.id !== id));
  }
  function toggleDish(id) {
    setDishes((prev) => prev.map((dish) => dish.id === id ? { ...dish, active: !dish.active } : dish));
  }

  function importAIResult(result) {
    const incoming = Array.isArray(result?.dishes) ? result.dishes : [];
    if (!incoming.length) throw new Error("ИИ не вернул ни одного блюда.");

    const existingByName = new Map(dishes.map((d) => [d.name.trim().toLowerCase(), d]));
    const categoryMap = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
    const nextCategories = [...categories];
    const newDishes = [];

    incoming.forEach((item, index) => {
      const categoryName = String(item.category || "Без категории").trim() || "Без категории";
      const key = categoryName.toLowerCase();
      let category = categoryMap.get(key);
      if (!category) {
        category = { id: uid("category"), restaurantId: restaurant.id, name: categoryName, sort: nextCategories.length + 1 };
        nextCategories.push(category);
        categoryMap.set(key, category);
      }
      const name = String(item.name || `Блюдо ${index + 1}`).trim();
      const normalized = name.toLowerCase();
      const existing = existingByName.get(normalized);
      const dish = {
        ...(existing || {}),
        id: existing?.id || uid("dish"),
        restaurantId: restaurant.id,
        categoryId: category.id,
        name,
        description: String(item.description || "").trim(),
        ingredients: String(item.ingredients || item.composition || "").trim(),
        price: Number(String(item.price ?? 0).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0,
        image: String(item.image || item.imageUrl || "").trim(),
        weight: item.weight || "",
        variants: Array.isArray(item.variants) ? item.variants : [],
        active: existing?.active !== false,
        aiConfidence: item.confidence ?? null,
      };
      if (existing) {
        const idx = newDishes.findIndex((d) => d.id === existing.id);
        if (idx >= 0) newDishes[idx] = dish; else newDishes.push(dish);
      } else newDishes.push(dish);
    });

    setCategories(nextCategories);
    setDishes((prev) => {
      const byId = new Map(prev.map((d) => [d.id, d]));
      newDishes.forEach((d) => byId.set(d.id, d));
      return [...byId.values()];
    });
    return newDishes.length;
  }

  if (menuSubpage === "category") {
    return (
      <div className="editor-page">
        <SubpageHeader title="Новая категория" onBack={() => setMenuSubpage(null)} />
        <CategoryModal
          fullPage
          onClose={() => setMenuSubpage(null)}
          onCreate={(name) => {
            setCategories((prev) => [...prev, { id: uid("category"), restaurantId: restaurant.id, name, sort: prev.length + 1 }]);
            setMenuSubpage(null);
          }}
        />
      </div>
    );
  }

  if (menuSubpage === "dish") {
    return (
      <div className="editor-page">
        <SubpageHeader title={editingDish ? "Редактировать блюдо" : "Новое блюдо"} onBack={() => { setMenuSubpage(null); setEditingDish(null); }} />
        <DishModal
          fullPage
          restaurant={restaurant}
          categories={categories}
          dish={editingDish}
          onClose={() => { setMenuSubpage(null); setEditingDish(null); }}
          onSave={(dish) => {
            setDishes((prev) => prev.some((item) => item.id === dish.id) ? prev.map((item) => item.id === dish.id ? dish : item) : [...prev, dish]);
            setMenuSubpage(null);
            setEditingDish(null);
          }}
        />
      </div>
    );
  }

  if (menuSubpage === "ai") {
    return (
      <div className="editor-page">
        <SubpageHeader title="Добавить меню с ИИ" onBack={() => setMenuSubpage(null)} />
        <AIMenuImportModal
          fullPage
          restaurant={restaurant}
          categories={categories}
          onClose={() => setMenuSubpage(null)}
          onImport={importAIResult}
        />
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">РЕСТОРАН</div><h1>Меню</h1><p>Управляйте категориями и блюдами ресторана</p></div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={() => setMenuSubpage("category")} type="button">Категория</button>
          <button className="primary-button" onClick={() => { setEditingDish(null); setMenuSubpage("dish"); }} type="button">Добавить блюдо</button>
        </div>
      </div>

      <div className="menu-toolbar">
        <div className="menu-search"><Icon name="search" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск" /></div>
        <div className="menu-toolbar-count">{visibleDishes.length} из {dishes.length} блюд</div>
      </div>

      <div className="menu-manager">
        <div className="category-panel">
          <button className={`category-item ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")} type="button"><span>Все блюда</span><strong>{dishes.length}</strong></button>
          {visibleCategories.map((category) => (
            <div className={`category-row ${activeCategory === category.id ? "active" : ""}`} key={category.id}>
              <button className="category-item" onClick={() => setActiveCategory(category.id)} type="button"><span>{category.name}</span><strong>{dishes.filter((d) => d.categoryId === category.id).length}</strong></button>
              <button className="category-delete" onClick={() => deleteCategory(category.id)} type="button" title="Удалить категорию"><Icon name="trash" size={14} /></button>
            </div>
          ))}
        </div>

        <div className="dish-grid">
          {visibleDishes.length === 0 ? (
            <EmptyState icon="menu" title="Блюд пока нет" text="Добавьте первое блюдо или загрузите меню через ИИ." button="Добавить блюдо" onClick={() => { setEditingDish(null); setMenuSubpage("dish"); }} />
          ) : visibleDishes.map((dish) => {
            const category = categories.find((c) => c.id === dish.categoryId);
            return (
              <div className={`dish-card ${dish.active ? "" : "dish-disabled"}`} key={dish.id}>
                <div className="dish-image">
                  {dish.image ? <img src={dish.image} alt={dish.name} /> : <div className="dish-image-placeholder"><Icon name="image" size={30} /></div>}
                  {!dish.active && <div className="dish-hidden">Скрыто</div>}
                </div>
                <div className="dish-body">
                  <div className="dish-category">{category?.name || "Без категории"}</div>
                  <h3>{dish.name}</h3>
                  <p>{dish.description || "Описание не указано"}</p>
                  {dish.ingredients && <div className="dish-ingredients">{dish.ingredients}</div>}
                  <div className="dish-bottom">
                    <strong>{money(dish.price)}</strong>
                    <div className="dish-actions">
                      <button onClick={() => toggleDish(dish.id)} title={dish.active ? "Скрыть" : "Показать"} type="button"><Icon name={dish.active ? "eye" : "eyeOff"} size={16} /></button>
                      <button onClick={() => { setEditingDish(dish); setMenuSubpage("dish"); }} title="Редактировать" type="button"><Icon name="edit" size={16} /></button>
                      <button onClick={() => deleteDish(dish.id)} title="Удалить" type="button"><Icon name="trash" size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </>
  );
}

/* -------------------------------------------------------
   LOCAL FESTO AI MENU ENGINE
   On-device OCR + layout parsing. No /api/menu/parse endpoint is required.
   OCR runs in the browser; the recognized menu blocks are converted into
   separate dishes with name, price, description, composition and a crop
   from the source menu photo.
------------------------------------------------------- */

let festoTesseractPromise = null;

function loadFestoTesseract() {
  if (typeof window !== "undefined" && window.Tesseract) return Promise.resolve(window.Tesseract);
  if (festoTesseractPromise) return festoTesseractPromise;
  festoTesseractPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-festo-tesseract="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Tesseract));
      existing.addEventListener("error", () => reject(new Error("Не удалось загрузить локальный OCR-модуль FESTO AI.")));
      return;
    }
    const script = document.createElement("script");
    script.dataset.festoTesseract = "1";
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("OCR-модуль FESTO AI не найден."));
    script.onerror = () => reject(new Error("Не удалось загрузить OCR-модуль. Проверьте интернет-соединение и повторите попытку."));
    document.head.appendChild(script);
  });
  return festoTesseractPromise;
}

function festoNormalizeOCRText(value) {
  return String(value || "")
    .replace(/[|¦]/g, "I")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

function festoParsePrice(value) {
  const text = festoNormalizeOCRText(value);
  const matches = [...text.matchAll(/(^|\s)(\d{2,5}(?:[.,]\d{1,2})?)(?:\s*(?:₽|руб(?:\.|лей)?|р\.?))?(?=\s*$)/gi)];
  if (!matches.length) return null;
  const raw = matches[matches.length - 1][2].replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) && n >= 20 && n <= 999999 ? n : null;
}

function festoNameWithoutPrice(value) {
  const text = festoNormalizeOCRText(value);
  const match = text.match(/^(.*?)(?:\s+)(\d{2,5}(?:[.,]\d{1,2})?)(?:\s*(?:₽|руб(?:\.|лей)?|р\.?))?$/i);
  const name = match ? match[1].replace(/[—–-]\s*$/, "").trim() : "";
  return festoLooksLikeDishName(name) ? name : "";
}

function festoLooksLikeNoise(text) {
  const t = festoNormalizeOCRText(text);
  if (!t || t.length < 2) return true;
  if (/^(меню|menu|цена|price|руб|₽|р\.?|вес|грамм|гр|мл|ml|g)$/i.test(t)) return true;
  const letters = (t.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  const digits = (t.match(/\d/g) || []).length;
  return letters < 2 || digits > letters * 2;
}

function festoLooksLikeDishName(text) {
  const t = festoNormalizeOCRText(text);
  if (festoLooksLikeNoise(t) || t.length > 90) return false;
  if (festoParsePrice(t) != null) return false;
  if (/^(состав|ингредиенты|описание|вес|выход|ккал|калорийность|цена|руб|₽)/i.test(t)) return false;
  return (t.match(/[A-Za-zА-Яа-яЁё]/g) || []).length >= 3;
}

function festoCompositionFromText(lines) {
  const joined = lines.map(festoNormalizeOCRText).filter(Boolean).join(" ");
  if (!joined) return "";
  const match = joined.match(/(?:состав|ингредиенты)\s*[:—-]?\s*(.+?)(?=\s+(?:цена|выход|вес)\b|$)/i);
  return match ? match[1].trim() : "";
}

async function festoImageSize(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    return { image: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function festoCropDataUrl(file, crop) {
  const { image, width, height } = await festoImageSize(file);
  const x = Math.max(0, Math.min(width - 1, Math.floor(crop.x)));
  const y = Math.max(0, Math.min(height - 1, Math.floor(crop.y)));
  const w = Math.max(1, Math.min(width - x, Math.floor(crop.w)));
  const h = Math.max(1, Math.min(height - y, Math.floor(crop.h)));
  const canvas = document.createElement("canvas");
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function festoClusterColumns(lines, imageWidth) {
  if (!lines.length) return [];
  const sorted = [...lines].sort((a, b) => a.x - b.x);
  const columns = [];
  const threshold = Math.max(90, imageWidth * 0.18);
  sorted.forEach(line => {
    const center = line.x + line.w / 2;
    let target = columns.find(c => Math.abs(c.center - center) < threshold);
    if (!target) {
      target = { lines: [], center };
      columns.push(target);
    }
    target.lines.push(line);
    target.center = target.lines.reduce((sum, item) => sum + item.x + item.w / 2, 0) / target.lines.length;
  });
  return columns.sort((a, b) => a.center - b.center);
}

async function festoRecognizeImage(file, onProgress) {
  const Tesseract = await loadFestoTesseract();
  let result;
  try {
    result = await Tesseract.recognize(file, "rus+eng", {
      logger: message => {
        if (message?.status === "recognizing text" && Number.isFinite(message.progress)) onProgress?.(message.progress);
      },
      tessedit_pageseg_mode: 6,
      preserve_interword_spaces: 1,
    });
  } catch (firstError) {
    // Some browsers/CDN caches fail while loading one of the language packs.
    // Retry with English OCR so the importer still works instead of silently dying.
    try {
      result = await Tesseract.recognize(file, "eng", {
        logger: message => {
          if (message?.status === "recognizing text" && Number.isFinite(message.progress)) onProgress?.(message.progress);
        },
        tessedit_pageseg_mode: 6,
        preserve_interword_spaces: 1,
      });
    } catch (secondError) {
      throw new Error(`FESTO AI не смог запустить OCR: ${secondError?.message || firstError?.message || "ошибка OCR"}`);
    }
  }
  const data = result?.data || {};
  const size = await festoImageSize(file);
  const imageWidth = size.width;
  const imageHeight = size.height;
  const rawLines = (data.lines || []).map(line => {
    const bbox = line.bbox || {};
    return {
      text: festoNormalizeOCRText(line.text),
      x: Number(bbox.x0 || 0),
      y: Number(bbox.y0 || 0),
      w: Math.max(1, Number(bbox.x1 || 0) - Number(bbox.x0 || 0)),
      h: Math.max(1, Number(bbox.y1 || 0) - Number(bbox.y0 || 0)),
    };
  }).filter(line => line.text && line.w > 3 && line.h > 3);

  const columns = festoClusterColumns(rawLines, imageWidth);
  const detected = [];
  for (const column of columns) {
    const lines = column.lines.sort((a, b) => a.y - b.y);
    const priceLines = lines.filter(line => festoParsePrice(line.text) != null);
    const anchors = priceLines.length ? priceLines : lines.filter(line => festoLooksLikeDishName(line.text));
    if (!anchors.length) continue;

    const left = Math.max(0, Math.min(...lines.map(l => l.x)) - 24);
    const right = Math.min(imageWidth, Math.max(...lines.map(l => l.x + l.w)) + 24);
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const previous = anchors[i - 1];
      const next = anchors[i + 1];
      const top = Math.max(0, previous ? Math.floor((previous.y + previous.h + anchor.y) / 2) : Math.floor(anchor.y - imageHeight * 0.09));
      const bottom = Math.min(imageHeight, next ? Math.floor((anchor.y + anchor.h + next.y) / 2) : Math.floor(anchor.y + imageHeight * 0.16));
      const nearby = lines.filter(line => line.y + line.h >= top && line.y <= bottom).sort((a, b) => a.y - b.y);
      const price = festoParsePrice(anchor.text);
      let nameIndex = nearby.findIndex(line => festoLooksLikeDishName(line.text) && (price == null || line.y <= anchor.y));
      if (nameIndex < 0) nameIndex = nearby.findIndex(line => festoLooksLikeDishName(line.text));
      const inlineName = nameIndex < 0 ? festoNameWithoutPrice(anchor.text) : "";
      if (nameIndex < 0 && !inlineName) continue;
      const name = inlineName || nearby[nameIndex].text;
      const textLines = nearby.filter((line, idx) => (nameIndex < 0 || idx !== nameIndex) && line !== anchor && !festoParsePrice(line.text));
      const description = textLines.map(l => l.text).filter(Boolean).join(" ").slice(0, 360);
      const ingredients = festoCompositionFromText(textLines);
      let image = "";
      try {
        image = await festoCropDataUrl(file, { x: left, y: top, w: Math.max(80, right - left), h: Math.max(80, bottom - top) });
      } catch (_) {}
      detected.push({
        name,
        price: price || 0,
        description: ingredients ? description.replace(ingredients, "").trim() : description,
        ingredients,
        image,
        category: "Без категории",
        confidence: typeof data.confidence === "number" ? Math.max(0, Math.min(1, data.confidence / 100)) : null,
        sourceFile: file.name,
      });
    }
  }

  // Deduplicate OCR anchors from overlapping columns/blocks.
  const unique = [];
  const seen = new Set();
  detected.forEach(item => {
    const key = `${item.name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim()}|${item.price}`;
    if (!seen.has(key)) { seen.add(key); unique.push(item); }
  });
  return unique;
}

async function festoLocalMenuAI(files, onProgress) {
  const imageFiles = files.filter(file => /^image\/(jpeg|png|webp|heic)/i.test(file.type) || /\.(jpe?g|png|webp|heic)$/i.test(file.name));
  if (!imageFiles.length) throw new Error("Для встроенного FESTO AI сейчас нужны фотографии меню (JPG, PNG или WEBP). PDF/Excel/Word можно оставить для отдельного серверного импорта.");
  const all = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const part = await festoRecognizeImage(imageFiles[i], progress => onProgress?.((i + progress) / imageFiles.length));
    all.push(...part);
  }
  const merged = [];
  const byName = new Map();
  all.forEach(item => {
    const key = item.name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim();
    if (!key) return;
    if (byName.has(key)) {
      const existing = byName.get(key);
      if (!existing.image && item.image) existing.image = item.image;
      if (!existing.ingredients && item.ingredients) existing.ingredients = item.ingredients;
      if (!existing.description && item.description) existing.description = item.description;
      if (!existing.price && item.price) existing.price = item.price;
    } else {
      byName.set(key, item);
      merged.push(item);
    }
  });
  return merged;
}

/* -------------------------------------------------------
   AI MENU IMPORT
------------------------------------------------------- */

function AIMenuImportModal({ restaurant, categories, onClose, onImport, fullPage = false }) {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [review, setReview] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = React.useRef(null);

  const accepted = ".jpg,.jpeg,.png,.webp,.heic,.pdf,.xlsx,.xls,.docx,.doc,.csv,.txt";

  function addFiles(list) {
    const incoming = Array.from(list || []);
    const allowed = incoming.filter((file) => /\.(jpe?g|png|webp|heic|pdf|xlsx?|docx?|csv|txt)$/i.test(file.name));
    setError(allowed.length === incoming.length ? "" : "Некоторые файлы пропущены: поддерживаются фото, PDF, Excel, Word, CSV и TXT.");
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f]));
      allowed.forEach((f) => map.set(`${f.name}-${f.size}-${f.lastModified}`, f));
      return [...map.values()];
    });
  }
  function removeFile(index) { setFiles((prev) => prev.filter((_, i) => i !== index)); }

  async function processFiles() {
    if (!files.length) { setError("Добавьте хотя бы один файл."); return; }
    setProcessing(true); setProgress(0); setError("");
    try {
      const dishes = await festoLocalMenuAI(files, value => setProgress(Math.round(value * 100)));
      if (!Array.isArray(dishes) || !dishes.length) throw new Error("Встроенный FESTO AI не нашел отдельных блюд. Попробуйте более четкое фото, где хорошо видны названия и цены.");
      setReview(dishes.map((dish, index) => ({ id: uid("ai-review"), confidence: dish.confidence ?? null, ...dish, _index: index })));
      setProgress(100);
    } catch (err) {
      setError(err.message || "Не удалось обработать фотографии меню.");
    } finally { setProcessing(false); }
  }

  function updateReview(id, field, value) { setReview((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item)); }
  function removeReview(id) { setReview((prev) => prev.filter((item) => item.id !== id)); }
  function confirmImport() {
    if (!review.length) return;
    const count = onImport({ dishes: review });
    alert(`В меню добавлено/обновлено блюд: ${count}`);
    onClose();
  }

  return (
    <div className={fullPage ? "form-page-content" : "modal-overlay"}>
      <div className="modal ai-import-modal">
        <div className="modal-header">
          <div><div className="eyebrow">FESTO AI MENU</div><h2>{review.length ? "Проверка меню" : "Добавить меню с ИИ"}</h2><p className="modal-subtitle">Встроенный ИИ работает прямо в браузере: находит отдельные карточки блюд даже на одной фотографии и переносит название, цену, состав, описание и фото-кроп.</p></div>
          <button type="button" className="close-button" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        {!review.length ? (
          <>
            <div className={`ai-dropzone ${dragActive ? "drag-active" : ""}`} onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }} onClick={() => inputRef.current?.click()}>
              <div className="ai-drop-icon"><Icon name="spark" size={25} /></div>
              <strong>Перетащите файлы сюда</strong>
              <span>или нажмите для выбора файлов</span>
              <small>JPG · PNG · WEBP · PDF · XLSX · XLS · DOCX · DOC · CSV</small>
              <input ref={inputRef} type="file" multiple accept={accepted} onChange={(e) => addFiles(e.target.files)} hidden />
            </div>

            <div className="ai-capabilities">
              <div><Icon name="image" size={17} /><span><strong>On-device OCR</strong> — распознаёт много блюд на одном фото и разбивает их на отдельные карточки</span></div>
              <div><Icon name="spark" size={17} /><span><strong>Умный разбор</strong> — связывает название, цену, описание и состав по расположению текста</span></div>
              <div><Icon name="image" size={17} /><span><strong>Фото блюда</strong> — сохраняет отдельный кроп исходной карточки меню для каждого найденного блюда</span></div>
            </div>

            {files.length > 0 && <div className="ai-file-list">{files.map((file, index) => <div className="ai-file-row" key={`${file.name}-${file.size}-${index}`}><Icon name={file.type.startsWith("image/") ? "image" : "file"} size={17} /><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} МБ</span></div><button type="button" onClick={() => removeFile(index)}><Icon name="close" size={15} /></button></div>)}</div>}
            {error && <div className="error ai-error">{error}</div>}
            <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Отмена</button><button className="primary-button" type="button" disabled={!files.length || processing} onClick={processFiles}>{processing ? `ИИ анализирует… ${progress}%` : <><Icon name="spark" size={17}/>Распознать меню</>}</button></div>
          </>
        ) : (
          <>
            <div className="ai-review-summary"><div><strong>{review.length}</strong><span>найдено блюд</span></div><div><strong>{review.filter((x) => x.confidence != null && Number(x.confidence) < 0.75).length}</strong><span>требуют проверки</span></div><div><strong>{files.length}</strong><span>источников</span></div></div>
            <div className="ai-review-list">{review.map((item) => <div className="ai-review-card" key={item.id}>
              <div className="ai-review-number">{item._index + 1}</div>
              <div className="ai-review-image">{item.image ? <img src={item.image} alt="Предпросмотр блюда" /> : <Icon name="image" size={24} />}</div>
              <div className="ai-review-fields">
                <div className="ai-review-grid">
                  <label>Название<input value={item.name || ""} onChange={(e) => updateReview(item.id, "name", e.target.value)} /></label>
                  <label>Категория<input value={item.category || ""} onChange={(e) => updateReview(item.id, "category", e.target.value)} placeholder="Например: Основные блюда" /></label>
                  <label>Цена<input value={item.price ?? ""} onChange={(e) => updateReview(item.id, "price", e.target.value)} inputMode="decimal" /></label>
                  <label>Вес / объём<input value={item.weight || ""} onChange={(e) => updateReview(item.id, "weight", e.target.value)} /></label>
                </div>
                <label>Описание<textarea value={item.description || ""} onChange={(e) => updateReview(item.id, "description", e.target.value)} rows="2" /></label>
                <label>Состав<input value={item.ingredients || item.composition || ""} onChange={(e) => updateReview(item.id, "ingredients", e.target.value)} /></label>
              </div>
              <div className="ai-review-side"><span className={`ai-confidence ${item.confidence != null && Number(item.confidence) < 0.75 ? "low" : ""}`}>{item.confidence == null ? "ПРОВЕРКА" : `${Math.round(Number(item.confidence) * 100)}%`}</span><button type="button" onClick={() => removeReview(item.id)} title="Убрать блюдо"><Icon name="trash" size={16} /></button></div>
            </div>)}</div>
            <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setReview([])}>Назад к файлам</button><button className="primary-button" type="button" onClick={confirmImport}><Icon name="check" size={17} />Добавить {review.length} блюд в меню</button></div>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   CATEGORY MODAL
------------------------------------------------------- */

function CategoryModal({ onClose, onCreate, fullPage = false }) {
  const [name, setName] = useState("");

  function submit(e) {
    e.preventDefault();

    if (!name.trim()) return;

    onCreate(name.trim());
  }

  return (
    <div className={fullPage ? "form-page-content" : "modal-overlay"}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">МЕНЮ</div>
            <h2>Новая категория</h2>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="form-section">
          <div className="input-group">
            <label>Название категории</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Завтраки"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Отмена
          </button>

          <button className="primary-button">
            Создать
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------
   DISH MODAL
------------------------------------------------------- */

function DishModal({
  restaurant,
  categories,
  dish,
  onClose,
  onSave,
  fullPage = false,
}) {
  const [form, setForm] = useState(
    dish || {
      name: "",
      description: "",
      price: "",
      image: "",
      images: [],
      categoryId: categories[0]?.id || "",
      active: true,
    }
  );

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      alert("Выберите только файлы изображений: JPG, PNG, WEBP и т. п.");
      e.target.value = "";
      return;
    }

    Promise.all(
      files.map((file) =>
        festoImageSize(file).then(({ image, width, height }) => {
          const maxSide = 1200;
          const scale = Math.min(
            1,
            maxSide / Math.max(width, height)
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));

          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) {
            throw new Error("Не удалось подготовить изображение.");
          }

          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          return canvas.toDataURL("image/jpeg", 0.82);
        })
      )
    )
      .then((dataUrls) => {
        const current = Array.isArray(form.images)
          ? form.images.filter(Boolean)
          : form.image
            ? [form.image]
            : [];

        const merged = Array.from(
          new Set([...current, ...dataUrls])
        );

        update("images", merged);
        update("image", merged[0] || "");
      })
      .catch(() =>
        alert("Не удалось обработать выбранные изображения.")
      )
      .finally(() => {
        e.target.value = "";
      });
  }

  function removeImage(index = null) {
    const current = Array.isArray(form.images)
      ? form.images.filter(Boolean)
      : form.image
        ? [form.image]
        : [];

    if (index === null) {
      update("images", []);
      update("image", "");
      return;
    }

    const next = current.filter((_, itemIndex) => itemIndex !== index);
    update("images", next);
    update("image", next[0] || "");
  }

  function submit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Введите название блюда.");
      return;
    }

    if (!form.categoryId) {
      alert("Выберите категорию.");
      return;
    }

    const result = {
      ...form,
      id: dish?.id || uid("dish"),
      restaurantId: restaurant.id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price || 0),
      image: form.image.trim(),
      images: Array.from(
        new Set(
          (Array.isArray(form.images) ? form.images : [])
            .filter(Boolean)
            .map((image) => String(image))
        )
      ),
      active: form.active !== false,
    };

    onSave(result);
  }

  return (
    <div className={fullPage ? "form-page-content" : "modal-overlay"}>
      <form className="modal large-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">МЕНЮ</div>
            <h2>
              {dish ? "Редактировать блюдо" : "Новое блюдо"}
            </h2>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="form-section">
          <h3>Основная информация</h3>

          <div className="input-group">
            <label>Название *</label>
            <input
              value={form.name}
              onChange={(e) =>
                update("name", e.target.value)
              }
              placeholder="Название блюда"
            />
          </div>

          <div className="input-group">
            <label>Описание</label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) =>
                update("description", e.target.value)
              }
              placeholder="Краткое описание блюда"
            />
          </div>

          <div className="two-columns">
            <div className="input-group">
              <label>Цена *</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  update("price", e.target.value)
                }
                placeholder="690"
              />
            </div>

            <div className="input-group">
              <label>Категория *</label>

              <select
                value={form.categoryId}
                onChange={(e) =>
                  update("categoryId", e.target.value)
                }
              >
                <option value="">
                  Выберите категорию
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Изображение</h3>

          <div className="input-group dish-image-upload-group">
            <label>Загрузить фото с компьютера</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
            />
            <small className="field-help">
              Можно выбрать несколько фотографий. Они будут доступны клиенту в окне блюда.
            </small>
          </div>

          {((Array.isArray(form.images) && form.images.length) || form.image) && (
            <div className="dish-upload-gallery">
              {(Array.isArray(form.images) && form.images.length
                ? form.images
                : [form.image]
              ).filter(Boolean).map((image, index) => (
                <div className="image-preview dish-upload-preview" key={`${image}-${index}`}>
                  <img src={image} alt={`Фото блюда ${index + 1}`} />
                  <button
                    type="button"
                    className="secondary-button dish-remove-image"
                    onClick={() => removeImage(index)}
                  >
                    Удалить фото
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <label className="switch-row">
            <span>
              <strong>Показывать блюдо</strong>
              <small>
                Если выключить, блюдо не будет видно гостям.
              </small>
            </span>

            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                update("active", e.target.checked)
              }
            />
          </label>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Отмена
          </button>

          <button className="primary-button">
            {dish ? "Сохранить" : "Добавить блюдо"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------
   TABLES
------------------------------------------------------- */

function TablesManager({
  restaurant,
  tables,
  setTables,
}) {
  const [tableSubpage, setTableSubpage] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // Navigation inside tables must always start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [tableSubpage]);

  function deleteTable(id) {
    if (!window.confirm("Удалить этот столик?")) return;

    setTables((prev) =>
      prev.filter((table) => table.id !== id)
    );

    if (selectedTable?.id === id) {
      setSelectedTable(null);
    }
  }

  function printQR(table) {
    setSelectedTable(table);
    window.setTimeout(() => {
      window.print();
    }, 250);
  }

  if (tableSubpage) {
    return (
      <div className="editor-page">
        <SubpageHeader title="Новый столик" onBack={() => setTableSubpage(false)} />
        <AddTableModal
          fullPage
          tables={tables}
          restaurant={restaurant}
          onClose={() => setTableSubpage(false)}
          onCreate={(table) => {
            const updatedTables = [...tables, table];

            setTables(updatedTables);
            setTableSubpage(false);

            festoApi("/api/sync", {
              method: "POST",
              body: JSON.stringify({
                tables: updatedTables,
              }),
            }).catch((error) => {
              console.error("FESTO table sync error:", error);
            });
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">РЕСТОРАН</div>
          <h1>Столы</h1>
          <p>
            У каждого стола свой QR-код и ссылка на меню
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setTableSubpage(true)}
        >
          + Добавить стол
        </button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          icon="table"
          title="Столов пока нет"
          text="Добавьте столик, чтобы получить QR-код."
          button="Добавить стол"
          onClick={() => setTableSubpage(true)}
        />
      ) : (
        <div className="table-grid">
          {tables.map((table) => (
            <div className="table-card" key={table.id}>
              <div className="table-top">
                <div>
                  <div className="eyebrow">СТОЛ</div>
                  <h2>{table.name}</h2>
                </div>

                <div className="table-number">
                  {table.number}
                </div>
              </div>

              <div className="qr-box">
                <QRCodeSVG
                  value={customerUrl(table.id, restaurant.id)}
                  size={240}
                  bgColor="#ffffff"
                  fgColor="#111111"
                  level="M"
                  marginSize={4}
                />
              </div>

              <div className="table-url">
                {customerUrl(table.id, restaurant.id)}
              </div>

              <div className="table-actions">
                <button
                  className="primary-button"
                  onClick={() =>
                    setSelectedTable(table)
                  }
                >
                  QR-код
                </button>

                <button
                  className="secondary-button"
                  onClick={() => printQR(table)}
                >
                  Печать QR
                </button>

                <button
                  className="danger-button"
                  onClick={() => deleteTable(table.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTable && (
        <QRModal
          table={selectedTable}
          restaurantId={restaurant.id}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------
   ADD TABLE
------------------------------------------------------- */

function AddTableModal({
  tables,
  restaurant,
  onClose,
  onCreate,
  fullPage = false,
}) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  function submit(e) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Введите название стола.");
      return;
    }

    const table = {
      id: uid("table"),
      restaurantId: restaurant.id,
      name: name.trim(),
      number:
        number.trim() ||
        String(
          tables.filter(
            (t) => t.restaurantId === restaurant.id
          ).length + 1
        ),
    };

    onCreate(table);
  }

  return (
    <div className={fullPage ? "form-page-content" : "modal-overlay"}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">СТОЛЫ</div>
            <h2>Добавить стол</h2>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="form-section">
          <div className="input-group">
            <label>Название</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Столик 3"
            />
          </div>

          <div className="input-group">
            <label>Номер</label>
            <input
              value={number}
              onChange={(e) =>
                setNumber(e.target.value)
              }
              placeholder="3"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Отмена
          </button>

          <button className="primary-button">
            Создать
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------
   QR MODAL
------------------------------------------------------- */

function QRModal({ table, restaurantId, onClose }) {
  const link = customerUrl(table.id, restaurantId);

  return (
    <div className="modal-overlay">
      <div className="modal qr-modal">
        <div className="modal-header">
          <div>
            <div className="eyebrow">QR-КОД</div>
            <h2>{table.name}</h2>
          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="qr-large">
          <QRCodeSVG
            value={link}
            size={320}
            bgColor="#ffffff"
            fgColor="#111111"
            level="M"
            marginSize={5}
          />
        </div>

        <div className="qr-link">
          {link}
        </div>

        <div className="modal-actions">
          <a
            className="primary-button"
            href={link}
            target="_blank"
            rel="noreferrer"
          >
            Открыть меню
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   ORDERS
------------------------------------------------------- */

function OrdersManager({
  restaurant,
  orders,
  setOrders,
}) {
  const [viewMode, setViewMode] = useState("active");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statuses = {
    new: "Новый",
    accepted: "Принят",
    preparing: "Готовится",
    assembled: "Собран",
    ready: "Готов",
    completed: "Завершён",
    cancelled: "Отменён",
  };

  const historyStatuses = ["completed", "cancelled"];

  const baseOrders =
    viewMode === "history"
      ? orders.filter((order) => historyStatuses.includes(order.status))
      : orders.filter((order) => !historyStatuses.includes(order.status));

  const filtered = baseOrders
    .filter((order) => {
      if (filter === "all") return true;
      return order.status === filter;
    })
    .filter((order) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        String(order.number).toLowerCase().includes(q) ||
        String(order.tableName || "").toLowerCase().includes(q) ||
        String(order.tableNumber || "").toLowerCase().includes(q)
      );
    })
    .filter((order) => {
      if (!dateFilter) return true;
      const date = new Date(order.createdAt);
      const localDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      return localDate === dateFilter;
    });

  function updateStatus(id, status) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              statusChangedAt: new Date().toISOString(),
              ...(status === "assembled" && !order.assembledAt ? { assembledAt: new Date().toISOString() } : {}),
              ...(status === "ready" ? { readyAt: new Date().toISOString() } : {}),
              ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}),
            }
          : order
      )
    );

    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => ({
        ...prev,
        status,
        statusChangedAt: new Date().toISOString(),
      }));
    }
  }

  const activeCount = orders.filter(
    (order) => !historyStatuses.includes(order.status)
  ).length;
  const historyCount = orders.filter((order) =>
    historyStatuses.includes(order.status)
  ).length;

  return (
    <>
      <div className="page-heading orders-heading">
        <div>
          <div className="eyebrow">РЕСТОРАН</div>
          <h1>Заказы</h1>
          <p>Заказы гостей из QR-меню</p>
        </div>

        <div className="orders-view-tabs">
          <button
            className={viewMode === "active" ? "active" : ""}
            onClick={() => {
              setViewMode("active");
              setFilter("all");
            }}
          >
            Активные <b>{activeCount}</b>
          </button>
          <button
            className={viewMode === "history" ? "active" : ""}
            onClick={() => {
              setViewMode("history");
              setFilter("all");
            }}
          >
            История <b>{historyCount}</b>
          </button>
        </div>
      </div>

      <div className="orders-toolbar">
        <input
          className="order-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по номеру или столу"
        />

        <select
          className="order-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Все статусы</option>
          {viewMode === "active" ? (
            <>
              <option value="new">Новые</option>
              <option value="accepted">Принятые</option>
              <option value="preparing">Готовятся</option>
              <option value="assembled">Собраны</option>
              <option value="ready">Готовы</option>
            </>
          ) : (
            <>
              <option value="completed">Завершённые</option>
              <option value="cancelled">Отменённые</option>
            </>
          )}
        </select>

        <label className="order-date-wrap">
          <span>{dateFilter ? new Date(`${dateFilter}T00:00:00`).toLocaleDateString("ru-RU") : "Дата"}</span>
          <input
            className="order-date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Фильтр по дате"
            aria-label="Дата"
          />
        </label>

        {(search || dateFilter || filter !== "all") && (
          <button
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setFilter("all");
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={viewMode === "history" ? "↺" : "□"}
          title={
            viewMode === "history"
              ? "История пока пуста"
              : "Заказов не найдено"
          }
          text={
            viewMode === "history"
              ? "Завершённые и отменённые заказы будут сохраняться здесь."
              : "Новые заказы гостей появятся здесь автоматически."
          }
        />
      ) : (
        <div className="orders-list">
          {filtered
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((order) => (
              <div
                className="order-card"
                key={order.id}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-main">
                  <div className="order-number">
                    #{String(order.number).padStart(4, "0")}
                  </div>

                  <div>
                    <h3>
                      {order.tableName || "Стол"}
                      {order.tableNumber && (
                        <span className="order-table-number">
                          · №{order.tableNumber}
                        </span>
                      )}
                    </h3>

                    <p>
                      {new Date(
                        order.createdAt
                      ).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>

                <div className="order-items-count">
                  {order.items.length} поз. ·{" "}
                  {order.items.reduce(
                    (sum, item) => sum + Number(item.quantity || 0),
                    0
                  )}{" "}
                  шт.
                </div>

                <div className="order-total">
                  {money(order.total)}
                </div>

                <div
                  className={`order-status status-${order.status}`}
                >
                  {statuses[order.status] || order.status}
                </div>
              </div>
            ))}
        </div>
      )}

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          statuses={statuses}
          onClose={() => setSelectedOrder(null)}
          onStatus={(status) =>
            updateStatus(selectedOrder.id, status)
          }
        />
      )}
    </>
  );
}

/* -------------------------------------------------------
   ORDER MODAL
------------------------------------------------------- */

function OrderModal({
  order,
  statuses,
  onClose,
  onStatus,
}) {
  const created = new Date(order.createdAt);
  const changed = order.statusChangedAt
    ? new Date(order.statusChangedAt)
    : null;

  return (
    <div className="modal-overlay">
      <div className="modal large-modal order-detail-modal">
        <div className="modal-header">
          <div>
            <div className="eyebrow">ЗАКАЗ</div>
            <h2>
              #{String(order.number).padStart(4, "0")}
            </h2>
            <p className="order-modal-subtitle">
              {order.tableName || "Гость"}
              {order.tableNumber
                ? ` · Стол №${order.tableNumber}`
                : ""}
            </p>
          </div>

          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="order-meta-grid">
          <div className="order-meta-card">
            <span>ОФОРМЛЕН</span>
            <strong>
              {created.toLocaleDateString("ru-RU")}{" "}
              {created.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>
          <div className="order-meta-card">
            <span>СТОЛ</span>
            <strong>
              {order.tableNumber || order.tableName || "—"}
            </strong>
          </div>
          <div className="order-meta-card">
            <span>СТАТУС</span>
            <strong>
              {statuses[order.status] || order.status}
            </strong>
          </div>
        </div>

        <div className="form-section">
          <h3>Позиции заказа</h3>

          <div className="order-detail-items">
            {order.items.map((item, index) => (
              <div
                className="order-detail-item"
                key={`${item.dishId}-${index}`}
              >
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity} × {money(item.price)}
                  </span>
                </div>

                <strong>
                  {money(item.quantity * item.price)}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {order.comment && (
          <div className="form-section">
            <h3>Комментарий гостя</h3>
            <div className="order-comment">
              {order.comment}
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Итого</h3>
          <div className="order-big-total">
            {money(order.total)}
          </div>
        </div>

        <div className="form-section">
          <h3>Изменить статус</h3>

          <div className="status-buttons">
            {Object.entries(statuses).map(
              ([key, label]) => (
                <button
                  key={key}
                  className={
                    order.status === key
                      ? "status-selected"
                      : ""
                  }
                  onClick={() => onStatus(key)}
                >
                  {label}
                </button>
              )
            )}
          </div>

          {changed && (
            <p className="order-status-changed">
              Последнее изменение:{" "}
              {changed.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="primary-button" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SETTINGS
------------------------------------------------------- */

function TelegramMiniAppPage() {
  return (
    <main
      className="customer-page"
      style={{
        "--customer-accent": "#6C4BF4",
        "--customer-background": "#F7F5F2",
        minHeight: "100vh",
      }}
    >
      <div
        className="customer-content"
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        <div className="glass-panel">
          <div className="eyebrow">RESTAURANT OS</div>

          <h1 style={{ marginTop: "12px" }}>
            FESTO
          </h1>

          <p className="muted">
            Управляйте рестораном прямо из Telegram.
          </p>

          <div className="info-box" style={{ marginTop: "24px" }}>
            <span>
              <strong>Mini App</strong>
            </span>
            <span>FESTO Telegram</span>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => window.Telegram?.WebApp?.close()}
          >
            Открыть FESTO
          </button>
        </div>
      </div>
    </main>
  );
}

function TelegramIntegrationPage() {
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(TELEGRAM_MINI_APP_URL);
      alert("Ссылка Mini App скопирована.");
    } catch {
      window.prompt("Скопируйте ссылку Mini App:", TELEGRAM_MINI_APP_URL);
    }
  }

  return (
    <div className="settings-card">
      <div className="eyebrow">INTEGRATIONS</div>
      <h1>Telegram</h1>
      <p>Подключение FESTO к Telegram Mini App.</p>

      <div className="info-box">
        <span><strong>Telegram Bot</strong></span>
        <span>@appfestobot</span>
      </div>

      <div className="info-box">
        <span><strong>Mini App URL</strong></span>
        <span style={{ wordBreak: "break-all" }}>
          {TELEGRAM_MINI_APP_URL}
        </span>
      </div>

      <button
        className="primary-button"
        type="button"
        onClick={copyUrl}
      >
        Скопировать ссылку Mini App
      </button>
    </div>
  );
}

function SettingsPage({
  title,
  subtitle,
  email,
}) {
  return (
    <div className="settings-card">
      <div className="eyebrow">FESTO</div>
      <h1>{title}</h1>

      <p>{subtitle}</p>

      <div className="info-box">
        <span>
          <strong>Главный администратор</strong>
        </span>

        <span>{email}</span>
      </div>

      <div className="info-box">
        <span>
          <strong>Лицензирование</strong>
        </span>

        <span>
          Все лицензии ресторанов бессрочные.
        </span>
      </div>

      <div className="info-box">
        <span>
          <strong>Авторизация</strong>
        </span>

        <span>
          Используется единая форма входа для
          администратора и директоров ресторанов.
        </span>
      </div>
    </div>
  );
}

function RestaurantSettings({
  restaurant,
  restaurants,
  setRestaurants,
}) {
  const [name, setName] = useState(restaurant.name);
  const [address, setAddress] = useState(
    restaurant.address
  );
  const [phone, setPhone] = useState(restaurant.phone);
  const [paymentBank, setPaymentBank] = useState(
    restaurant.paymentBank || ""
  );
  const [paymentPhone, setPaymentPhone] = useState(
    restaurant.paymentPhone || restaurant.phone || ""
  );
  const [accent, setAccent] = useState(
    restaurant.accent || "#6C4BF4"
  );
  const [customerBackground, setCustomerBackground] = useState(
    restaurant.customerBackground || "#F7F5F2"
  );
  const [logo, setLogo] = useState(restaurant.logo || "");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Выберите файл изображения: JPG, PNG, WEBP и т. п.");
      e.target.value = "";
      return;
    }

    festoImageSize(file)
      .then(({ image, width, height }) => {
        const maxSide = 800;
        const scale = Math.min(1, maxSide / Math.max(width, height));

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          throw new Error("Не удалось подготовить изображение.");
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.82);
      })
      .then((dataUrl) => setLogo(dataUrl))
      .catch(() => {
        alert("Не удалось обработать выбранный логотип.");
        e.target.value = "";
      });
  }

  function removeLogo() {
    setLogo("");
  }

  function saveDetails() {
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === restaurant.id
          ? {
              ...r,
              name,
              address,
              phone,
              logo,
              paymentBank,
              paymentPhone,
            }
          : r
      )
    );

    alert("Данные сохранены.");
  }

  function saveAccentColor() {
    const updatedRestaurants = restaurants.map((r) =>
      r.id === restaurant.id
        ? {
            ...r,
            accent,
          }
        : r
    );

    setRestaurants(updatedRestaurants);

    festoApi("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        restaurants: updatedRestaurants,
      }),
    }).catch((error) => {
      console.error("FESTO accent sync error:", error);
    });

    alert("Акцентный цвет сохранён.");
  }

  function saveCustomerBackground() {
    const updatedRestaurants = restaurants.map((r) =>
      r.id === restaurant.id
        ? {
            ...r,
            customerBackground,
          }
        : r
    );

    setRestaurants(updatedRestaurants);

    festoApi("/api/sync", {
      method: "POST",
      body: JSON.stringify({
        restaurants: updatedRestaurants,
      }),
    }).catch((error) => {
      console.error("FESTO customer background sync error:", error);
    });

    alert("Цвет фона клиентской страницы сохранён.");
  }

  function changePassword() {
    if (oldPassword !== restaurant.password) {
      alert("Текущий пароль указан неверно.");
      return;
    }

    if (newPassword.length < 4) {
      alert("Новый пароль должен быть не менее 4 символов.");
      return;
    }

    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === restaurant.id
          ? {
              ...r,
              password: newPassword,
            }
          : r
      )
    );

    setOldPassword("");
    setNewPassword("");

    alert("Пароль изменён.");
  }

  return (
    <div className="settings-card">
      <div className="eyebrow">РЕСТОРАН</div>
      <h1>Настройки</h1>

      <p>
        Данные ресторана и доступ директора.
      </p>

      <div className="details-edit">
        <h3>Название ресторана</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="details-edit">
        <h3>Адрес</h3>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="details-edit">
        <h3>Телефон</h3>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="details-edit sbp-payment-settings">
        <div className="eyebrow">СБП</div>
        <h3>Реквизиты для оплаты</h3>

        <p className="muted">
          Эти данные будут показаны клиенту при оплате заказа через СБП.
        </p>

        <label className="sbp-setting-label">
          Банк получателя
          <select
            value={paymentBank}
            onChange={(e) => setPaymentBank(e.target.value)}
          >
            <option value="">Выберите банк</option>
            <option value="Т-Банк">Т-Банк</option>
            <option value="Сбер">Сбер</option>
            <option value="Альфа-Банк">Альфа-Банк</option>
            <option value="ВТБ">ВТБ</option>
            <option value="Газпромбанк">Газпромбанк</option>
            <option value="ПСБ">ПСБ</option>
            <option value="Райффайзенбанк">Райффайзенбанк</option>
            <option value="Другой банк">Другой банк</option>
          </select>
        </label>

        <label className="sbp-setting-label">
          Номер телефона для оплаты
          <input
            type="tel"
            value={paymentPhone}
            onChange={(e) => setPaymentPhone(e.target.value)}
            placeholder="+7 900 000-00-00"
          />
        </label>

        <p className="sbp-setting-hint">
          Укажите номер телефона, к которому привязан счёт предприятия в выбранном банке.
        </p>
      </div>

      <div className="details-edit color-setting-block">
        <h3>Акцентный цвет</h3>

        <input
          type="color"
          className="color-input"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
        />

        <button
          type="button"
          className="primary-button color-setting-save"
          onClick={saveAccentColor}
        >
          Сохранить акцентный цвет
        </button>
      </div>

      <div className="details-edit customer-background-setting">
        <h3>Цвет фона клиентской страницы</h3>
        <div className="customer-background-picker">
          <input
            type="color"
            value={customerBackground}
            onChange={(e) => setCustomerBackground(e.target.value)}
            aria-label="Цвет фона клиентской страницы"
          />
          <input
            type="text"
            value={customerBackground}
            onChange={(e) => setCustomerBackground(e.target.value)}
            placeholder="#F7F5F2"
            maxLength={7}
          />
        </div>
        <small className="field-help">
          Этот цвет используется на клиентской странице меню и заказа.
        </small>

        <button
          type="button"
          className="primary-button color-setting-save"
          onClick={saveCustomerBackground}
        >
          Сохранить цвет фона
        </button>
      </div>

      <div className="details-edit">
        <h3>Логотип ресторана</h3>

        {logo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <img
              src={logo}
              alt="Логотип ресторана"
              style={{
                width: 88,
                height: 88,
                objectFit: "cover",
                borderRadius: 24,
                display: "block",
              }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label
                className="secondary-button logo-replace-button"
                style={{ cursor: "pointer" }}
              >
                Заменить логотип
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: "none" }}
                />
              </label>

              <button
                type="button"
                className="secondary-button"
                onClick={removeLogo}
              >
                Удалить
              </button>
            </div>
          </div>
        ) : (
          <label className="secondary-button" style={{ cursor: "pointer" }}>
            Загрузить логотип
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: "none" }}
            />
          </label>
        )}

        
      </div>

      <button
        className="primary-button"
        onClick={saveDetails}
        style={{ marginTop: 15 }}
      >
        Сохранить изменения
      </button>

      <div className="password-section">
        <h3>Изменить пароль</h3>

        <input
          type="password"
          value={oldPassword}
          onChange={(e) =>
            setOldPassword(e.target.value)
          }
          placeholder="Текущий пароль"
        />

        <input
          type="password"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(e.target.value)
          }
          placeholder="Новый пароль"
        />

        <button
          className="secondary-button"
          onClick={changePassword}
        >
          Изменить пароль
        </button>
      </div>

      <div className="info-box">
        <span>Логин директора</span>
        <strong>{restaurant.login}</strong>

        <span>Лицензия</span>
        <strong>{restaurant.license}</strong>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   CUSTOMER QR MENU
------------------------------------------------------- */

function getCustomerGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Доброе утро";
  if (hour >= 12 && hour < 18) return "Добрый день";
  if (hour >= 18 && hour < 23) return "Добрый вечер";
  return "Доброй ночи";
}

function CustomerApp({
  restaurant,
  categories,
  dishes,
  tables,
  setOrders,
  publicData = null,
}) {
  const params = new URLSearchParams(window.location.search);
  const tableId = params.get("table");
  const restaurantIdFromUrl = params.get("restaurant");

  const publicRestaurant = publicData?.restaurant || restaurant;
  const publicCategories = publicData?.categories || categories;
  const publicDishes = publicData?.dishes || dishes;
  const publicTable = publicData?.table || null;

  const table =
    publicTable ||
    tables.find(
      (item) =>
        item.id === tableId &&
        item.restaurantId === restaurant.id &&
        (!restaurantIdFromUrl ||
          item.restaurantId === restaurantIdFromUrl)
    );

  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState("menu");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderComment, setOrderComment] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tbankPaymentState, setTbankPaymentState] = useState("idle");
  const [tbankPaymentOrderId, setTbankPaymentOrderId] = useState("");
  const [tbankPaymentError, setTbankPaymentError] = useState("");

  // CUSTOMER CHECKOUT — всегда показываем новую страницу с самого верха
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [checkoutStep, orderComplete, tbankPaymentState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tbankResult = params.get("tbank");
    const orderId = String(
      params.get("orderId") || ""
    ).trim();

    if (!tbankResult || !orderId) {
      return;
    }

    if (tbankResult === "fail") {
      setTbankPaymentOrderId(orderId);
      setTbankPaymentState("failed");
      setTbankPaymentError(
        "Оплата не была завершена. Заказ не передан в ресторан."
      );
      return;
    }

    if (tbankResult !== "success") {
      return;
    }

    let cancelled = false;
    let timer = null;
    const startedAt = Date.now();

    setTbankPaymentOrderId(orderId);
    setTbankPaymentState("waiting");
    setTbankPaymentError("");

    async function checkPayment() {
      if (cancelled) {
        return;
      }

      try {
        const result = await festoApi(
          `/api/tbank/status?orderId=${encodeURIComponent(orderId)}`
        );

        if (cancelled) {
          return;
        }

        if (
          result?.confirmed &&
          result?.orderCreated &&
          result?.order
        ) {
          setSubmittedOrder(result.order);
          setCart([]);
          setOrderComment("");
          setTbankPaymentState("idle");
          setOrderComplete(true);

          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );

          return;
        }

        const status = String(
          result?.status || ""
        ).toUpperCase();

        if (
          [
            "REJECTED",
            "CANCELED",
            "CANCELLED",
            "DEADLINE_EXPIRED",
          ].includes(status)
        ) {
          setTbankPaymentState("failed");
          setTbankPaymentError(
            "Т-Банк отклонил оплату. Заказ не передан в ресторан."
          );

          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );

          return;
        }

        if (Date.now() - startedAt >= 10 * 60 * 1000) {
          setTbankPaymentState("failed");
          setTbankPaymentError(
            "Не удалось дождаться подтверждения оплаты. Проверьте статус платежа позже."
          );

          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );

          return;
        }
      } catch (error) {
        console.error(
          "FESTO T-Bank status error:",
          error
        );
      }

      if (!cancelled) {
        timer = window.setTimeout(
          checkPayment,
          2000
        );
      }
    }

    checkPayment();

    return () => {
      cancelled = true;

      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const restaurantCategories = (publicCategories || [])
    .filter(
      (category) =>
        category.restaurantId === publicRestaurant.id || publicData
    )
    .sort(
      (a, b) =>
        Number(a.sort || 0) - Number(b.sort || 0)
    );

  const restaurantDishes = (publicDishes || []).filter(
    (dish) =>
      dish.active !== false &&
      (publicData || dish.restaurantId === publicRestaurant.id)
  );

  const filteredDishes =
    activeCategory === "all"
      ? restaurantDishes
      : restaurantDishes.filter(
          (dish) => dish.categoryId === activeCategory
        );

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const cartCount = cart.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const upsellDishes = useMemo(() => {
    const cartIds = new Set(
      cart.map((item) => item.dishId)
    );

    const available = restaurantDishes.filter(
      (dish) => !cartIds.has(dish.id)
    );

    const categoryMap = new Map(
      restaurantCategories.map((category) => [
        category.id,
        String(category.name || "").toLowerCase(),
      ])
    );

    const priorityWords = [
      "напит",
      "drink",
      "соус",
      "sauce",
      "закуск",
      "snack",
      "карто",
      "десерт",
      "слад",
    ];

    const priority = [];
    const regular = [];

    available.forEach((dish) => {
      const categoryName =
        categoryMap.get(dish.categoryId) || "";

      const text =
        `${dish.name || ""} ${categoryName}`.toLowerCase();

      if (
        priorityWords.some((word) =>
          text.includes(word)
        )
      ) {
        priority.push(dish);
      } else {
        regular.push(dish);
      }
    });

    return [...priority, ...regular].slice(0, 6);
  }, [
    cart,
    restaurantDishes,
    restaurantCategories,
  ]);

  function addToCart(dish) {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.dishId === dish.id
      );

      if (existing) {
        return prev.map((item) =>
          item.dishId === dish.id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name,
          price: Number(dish.price || 0),
          quantity: 1,
          image: dish.image || null,
          images: Array.isArray(dish.images)
            ? dish.images.filter(Boolean)
            : dish.image
              ? [dish.image]
              : [],
          description: dish.description || "",
        },
      ];
    });
  }

  function changeQuantity(dishId, delta) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.dishId === dishId
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + delta,
              }
            : item
        )
        .filter(
          (item) => Number(item.quantity || 0) > 0
        )
    );
  }

  function openCheckout() {
    if (!cart.length) {
      return;
    }

    setCheckoutStep("cart");
  }

  function continueFromCart() {
    if (!cart.length) {
      return;
    }

    setCheckoutStep("upsell");
  }

  function continueFromUpsell() {
    setCheckoutStep("review");
  }

  async function submitOrder() {
    if (!cart.length || !table || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setTbankPaymentError("");

    const orderDraft = {
      restaurantId: publicRestaurant.id,
      tableId: table.id,
      tableName:
        table.name ||
        `Стол ${table.number ?? ""}`,
      tableNumber:
        table.number ??
        table.name ??
        "0",
      items: cart.map((item) => ({
        dishId: item.dishId,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      total: cartTotal,
      comment: orderComment.trim(),
    };

    try {
      const payment = await festoApi(
        "/api/tbank/payment",
        {
          method: "POST",
          body: JSON.stringify(orderDraft),
        }
      );

      if (
        !payment?.ok ||
        !payment?.paymentUrl
      ) {
        throw new Error(
          payment?.error ||
            "Не удалось подготовить оплату."
        );
      }

      window.location.assign(
        payment.paymentUrl
      );
    } catch (error) {
      console.error(
        "FESTO T-Bank payment initialization error:",
        error
      );

      alert(
        error?.message ||
          "Не удалось подготовить оплату. Попробуйте ещё раз."
      );

      setIsSubmitting(false);
    }
  }

  if (!table) {
    return (
      <CustomerError
        title="Стол не найден"
        text="Проверьте QR-код или ссылку на меню."
      />
    );
  }

  if (orderComplete) {
    return (
      <div
        className="customer-page customer-success-page"
        style={{
          "--customer-accent":
            publicRestaurant.accent || "#6C4BF4",
          "--customer-background":
            publicRestaurant.customerBackground || "#F7F5F2",
        }}
      >
        <div className="customer-success-card">
          <div className="customer-success-icon">
            <span className="customer-success-check">✓</span>
          </div>

          <div className="customer-eyebrow">
            ЗАКАЗ ПРИНЯТ
          </div>

          <h1>Спасибо!</h1>

          <p>
            Заказ уже поступил в ресторан.
            <br />
            Официант скоро займётся им.
          </p>

          {submittedOrder?.id && (
            <div className="customer-success-order">
              Заказ #{String(submittedOrder.id).slice(-6)}
            </div>
          )}

          <button
            type="button"
            className="customer-primary-button"
            onClick={() => {
              setOrderComplete(false);
              setCheckoutStep("menu");
            }}
          >
            Вернуться в меню
          </button>
        </div>
      </div>
    );
  }

  if (checkoutStep === "cart") {
    return (
      <CustomerCheckoutLayout
        publicRestaurant={publicRestaurant}
        table={table}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onBack={() => setCheckoutStep("menu")}
      >
        <CustomerCartPage
          cart={cart}
          cartTotal={cartTotal}
          orderComment={orderComment}
          setOrderComment={setOrderComment}
          onChangeQuantity={changeQuantity}
          onSubmit={() => setCheckoutStep("review")}
          isSubmitting={isSubmitting}
        />
      </CustomerCheckoutLayout>
    );
  }

  if (checkoutStep === "review") {
    return (
      <CustomerCheckoutLayout
        publicRestaurant={publicRestaurant}
        table={table}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onBack={() => setCheckoutStep("cart")}
      >
        <CustomerReviewPage
          cart={cart}
          cartTotal={cartTotal}
          orderComment={orderComment}
          setOrderComment={setOrderComment}
          onChangeQuantity={changeQuantity}
          onSubmit={submitOrder}
          isSubmitting={isSubmitting}
        />
      </CustomerCheckoutLayout>
    );
  }

  if (tbankPaymentState === "waiting") {
    return (
      <div
        className="customer-page customer-payment-page"
        style={{
          "--customer-accent":
            publicRestaurant.accent || "#6C4BF4",
          "--customer-background":
            publicRestaurant.customerBackground || "#F7F5F2",
        }}
      >
        <div className="customer-payment-card">
          <div className="customer-eyebrow">
            ПРОВЕРКА ОПЛАТЫ
          </div>

          <div className="customer-payment-icon">
            …
          </div>

          <h1>Проверяем оплату</h1>

          <p className="customer-payment-description">
            Т-Банк сообщил о возврате со страницы оплаты.
            <br />
            Ждём подтверждение платежа от банка.
          </p>

          <div className="customer-payment-total">
            <span>Заказ</span>
            <strong>
              #{tbankPaymentOrderId.slice(-6)}
            </strong>
          </div>

          <p className="customer-payment-hint">
            Не закрывайте страницу. Заказ появится
            в ресторане только после подтверждения
            успешной оплаты.
          </p>
        </div>
      </div>
    );
  }

  if (tbankPaymentState === "failed") {
    return (
      <div
        className="customer-page customer-payment-page"
        style={{
          "--customer-accent":
            publicRestaurant.accent || "#6C4BF4",
          "--customer-background":
            publicRestaurant.customerBackground || "#F7F5F2",
        }}
      >
        <div className="customer-payment-card">
          <div className="customer-eyebrow">
            ОПЛАТА
          </div>

          <div className="customer-payment-icon">
            !
          </div>

          <h1>Оплата не подтверждена</h1>

          <p className="customer-payment-description">
            {tbankPaymentError ||
              "Платёж не был подтверждён."}
          </p>

          <button
            type="button"
            className="customer-primary-button"
            onClick={() => {
              setTbankPaymentState("idle");
              setTbankPaymentOrderId("");
              setTbankPaymentError("");
              setCheckoutStep("review");

              window.history.replaceState(
                {},
                "",
                window.location.pathname
              );
            }}
          >
            Вернуться к заказу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="customer-page"
      style={{
        "--customer-accent":
          publicRestaurant.accent || "#6C4BF4",
        "--customer-background":
          publicRestaurant.customerBackground || "#F7F5F2",
      }}
    >
      <header className="customer-header">
        <div className="customer-brand">
          {publicRestaurant.logo ? (
            <img
              src={publicRestaurant.logo}
              alt={publicRestaurant.name || "Ресторан"}
              className="customer-restaurant-logo"
            />
          ) : (
            <div className="customer-logo">
              F
            </div>
          )}

          <div className="customer-brand-text">
            <div className="customer-eyebrow">
              {publicRestaurant.name}
            </div>

            <div className="customer-table">
              {table.name ||
                `Стол ${table.number ?? ""}`}
            </div>
          </div>
        </div>
      </header>

      <main className="customer-main">
        <section className="customer-title">
          <div className="customer-eyebrow">
            МЕНЮ
          </div>

          <h1>{getCustomerGreeting()}</h1>
        </section>

        <div className="customer-categories">
          <button
            type="button"
            className={
              activeCategory === "all"
                ? "customer-category active"
                : "customer-category"
            }
            onClick={() => setActiveCategory("all")}
          >
            Всё
          </button>

          {restaurantCategories.map(
            (category) => (
              <button
                type="button"
                key={category.id}
                className={
                  activeCategory === category.id
                    ? "customer-category active"
                    : "customer-category"
                }
                onClick={() =>
                  setActiveCategory(category.id)
                }
              >
                {category.name}
              </button>
            )
          )}
        </div>

        <section className="customer-dishes">
          {filteredDishes.length ? (
            filteredDishes.map((dish) => (
              <CustomerDish
                key={dish.id}
                dish={dish}
                onAdd={() => addToCart(dish)}
              />
            ))
          ) : (
            <div className="customer-empty">
              В этой категории пока нет блюд.
            </div>
          )}
        </section>
      </main>

      <footer className="customer-company-footer">
        <strong>ООО "Фесто"</strong>
        <span>ИНН: 1800054857</span>
        <span>ОГРН: 1261800009679</span>
      </footer>

      <div className="customer-bottom-bar">
        <button
          type="button"
          className="customer-bottom-menu"
          onClick={() => setActiveCategory("all")}
        >
          <Icon
            name="grid"
            size={20}
            strokeWidth={2}
          />
          <span>Меню</span>
        </button>

        <button
          type="button"
          className={
            cartCount > 0
              ? "customer-bottom-order has-items"
              : "customer-bottom-order"
          }
          onClick={openCheckout}
        >
          <span>Мой заказ</span>

          {cartCount > 0 && (
            <span className="customer-bottom-order-meta">
              <span className="customer-bottom-badge">
                {cartCount}
              </span>

              <strong>
                {money(cartTotal)}
              </strong>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function CustomerCheckoutLayout({
  publicRestaurant,
  table,
  cartCount,
  cartTotal,
  onBack,
  children,
}) {
  return (
    <div
      className="customer-page customer-checkout-page"
      style={{
        "--customer-accent":
          publicRestaurant.accent || "#6C4BF4",
        "--customer-background":
          publicRestaurant.customerBackground || "#F7F5F2",
      }}
    >
      <header className="customer-checkout-header">
        <button
          type="button"
          className="customer-checkout-back"
          onClick={onBack}
          aria-label="Назад"
        >
          <Icon
            name="arrow"
            size={22}
            strokeWidth={2}
            className="customer-checkout-back-icon"
          />
        </button>

        <div>
          <div className="customer-eyebrow">
            {publicRestaurant.name}
          </div>

          <strong>
            {table.name ||
              `Стол ${table.number ?? ""}`}
          </strong>
        </div>

        <div className="customer-checkout-mini-total">
          {cartCount > 0 ? money(cartTotal) : ""}
        </div>
      </header>

      <main className="customer-checkout-content">
        {children}
      </main>
    </div>
  );
}

function CustomerCartPage({
  cart,
  cartTotal,
  orderComment,
  setOrderComment,
  onChangeQuantity,
  onSubmit,
  isSubmitting,
}) {
  return (
    <section className="customer-cart-page">
      <div className="customer-eyebrow">
        МОЙ ЗАКАЗ
      </div>

      <h1>Ваш заказ</h1>

      <div className="customer-order-list">
        {cart.map((item) => (
          <div
            className="customer-order-row"
            key={item.dishId}
          >
            <div className="customer-order-row-main">
              <strong>{item.name}</strong>

              <span>
                {money(item.price)} ×{" "}
                {item.quantity}
              </span>
            </div>

            <div className="customer-quantity">
              <button
                type="button"
                onClick={() =>
                  onChangeQuantity(
                    item.dishId,
                    -1
                  )
                }
                aria-label="Уменьшить количество"
              >
                −
              </button>

              <span>{item.quantity}</span>

              <button
                type="button"
                onClick={() =>
                  onChangeQuantity(
                    item.dishId,
                    1
                  )
                }
                aria-label="Увеличить количество"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="customer-comment">
        <span>Комментарий к заказу</span>

        <textarea
          value={orderComment}
          onChange={(event) =>
            setOrderComment(event.target.value)
          }
          placeholder="Например: без лука, соус отдельно..."
          maxLength={300}
        />
      </label>

      <div className="customer-total-row">
        <span>Итого</span>
        <strong>{money(cartTotal)}</strong>
      </div>

      <button
        type="button"
        className="customer-primary-button"
        onClick={onSubmit}
        disabled={isSubmitting || !cart.length}
      >
        {isSubmitting ? "Оформляем заказ..." : "Оформить заказ"}
      </button>
    </section>
  );
}

function CustomerUpsellPage({
  dishes,
  cartTotal,
  onAdd,
  onSkip,
  onContinue,
}) {
  return (
    <section className="customer-upsell-page">
      <div className="customer-eyebrow">
        ДОПОЛНИТЕ ЗАКАЗ
      </div>

      <h1>
        Может, ещё что-нибудь?
      </h1>

      <p className="customer-upsell-description">
        Часто к заказу добавляют напитки,
        соусы, закуски и десерты.
      </p>

      {dishes.length > 0 && (
        <div className="customer-upsell-list">
          {dishes.map((dish) => (
            <article
              className="customer-upsell-card"
              key={dish.id}
            >
              {dish.image ? (
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="customer-upsell-image"
                />
              ) : (
                <div className="customer-upsell-image customer-upsell-image-placeholder">
                  F
                </div>
              )}

              <div className="customer-upsell-card-body">
                <strong>{dish.name}</strong>

                {dish.description && (
                  <p>
                    {dish.description}
                  </p>
                )}

                <div className="customer-upsell-card-footer">
                  <span>
                    {money(dish.price)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onAdd(dish)}
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="customer-upsell-actions">
        <button
          type="button"
          className="customer-secondary-button"
          onClick={onSkip}
        >
          Пропустить
        </button>

        <button
          type="button"
          className="customer-primary-button"
          onClick={onContinue}
        >
          Перейти к проверке ·{" "}
          {money(cartTotal)}
        </button>
      </div>
    </section>
  );
}

function CustomerReviewPage({
  cart,
  cartTotal,
  orderComment,
  setOrderComment,
  onChangeQuantity,
  onSubmit,
  isSubmitting,
}) {
  return (
    <section className="customer-review-page">
      <div className="customer-eyebrow">
        ПОСЛЕДНИЙ ШАГ
      </div>

      <h1>Проверьте заказ</h1>

      <div className="customer-review-card">
        {cart.map((item) => (
          <div
            className="customer-review-row"
            key={item.dishId}
          >
            <div>
              <strong>{item.name}</strong>

              <span>
                {money(item.price)} ×{" "}
                {item.quantity}
              </span>
            </div>

            <div className="customer-quantity">
              <button
                type="button"
                onClick={() =>
                  onChangeQuantity(
                    item.dishId,
                    -1
                  )
                }
                aria-label="Уменьшить количество"
              >
                −
              </button>

              <span>{item.quantity}</span>

              <button
                type="button"
                onClick={() =>
                  onChangeQuantity(
                    item.dishId,
                    1
                  )
                }
                aria-label="Увеличить количество"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="customer-comment">
        <span>Комментарий к заказу</span>

        <textarea
          value={orderComment}
          onChange={(event) =>
            setOrderComment(event.target.value)
          }
          placeholder="Например: без лука, соус отдельно..."
          maxLength={300}
        />
      </label>

      <div className="customer-total-row">
        <span>Итого</span>
        <strong>{money(cartTotal)}</strong>
      </div>

      <p className="customer-final-note">
        После нажатия вы будете перенаправлены
        на защищённую страницу оплаты Т-Банка.
        Заказ поступит в ресторан только после
        подтверждения успешной оплаты.
      </p>

      <button
        type="button"
        className="customer-primary-button"
        onClick={onSubmit}
        disabled={
          isSubmitting ||
          !cart.length
        }
      >
        {isSubmitting
          ? "Подготавливаем оплату..."
          : "Оформить заказ"}
      </button>
    </section>
  );
}

function CustomerDish({ dish, onAdd }) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const photos = Array.from(
    new Set(
      [
        dish.image,
        ...(Array.isArray(dish.images) ? dish.images : []),
      ].filter(Boolean)
    )
  );

  function openPhoto() {
    if (!photos.length) return;
    setPhotoIndex(0);
    setZoom(1);
    setPhotoOpen(true);
  }

  function closePhoto() {
    setPhotoOpen(false);
    setZoom(1);
  }

  function zoomIn(e) {
    e.stopPropagation();
    setZoom((value) =>
      Math.min(3, Number((value + 0.25).toFixed(2)))
    );
  }

  function zoomOut(e) {
    e.stopPropagation();
    setZoom((value) =>
      Math.max(0.5, Number((value - 0.25).toFixed(2)))
    );
  }

  function previousPhoto(e) {
    e.stopPropagation();
    setPhotoIndex((value) =>
      value === 0 ? photos.length - 1 : value - 1
    );
    setZoom(1);
  }

  function nextPhoto(e) {
    e.stopPropagation();
    setPhotoIndex((value) =>
      value === photos.length - 1 ? 0 : value + 1
    );
    setZoom(1);
  }

  const currentPhoto = photos[photoIndex] || photos[0];

  return (
    <>
      <div
        className={`customer-dish${photos.length ? " customer-dish-clickable" : ""}`}
        onClick={openPhoto}
        role={photos.length ? "button" : undefined}
        tabIndex={photos.length ? 0 : undefined}
        onKeyDown={(e) => {
          if (
            photos.length &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            openPhoto();
          }
        }}
      >
        <div className="customer-dish-image">
          {photos.length ? (
            <img src={photos[0]} alt={dish.name} />
          ) : (
            <div className="customer-image-placeholder">
              F
            </div>
          )}
        </div>

        <div className="customer-dish-info">
          <h2>{dish.name}</h2>

          {dish.description && (
            <p>{dish.description}</p>
          )}

          <div className="customer-dish-bottom">
            <strong>{money(dish.price)}</strong>

            <button
              className="add-dish-button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {photoOpen && (
        <div
          className="dish-photo-modal"
          onClick={closePhoto}
          role="dialog"
          aria-modal="true"
          aria-label={`Фотографии блюда ${dish.name}`}
        >
          <div
            className="dish-photo-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="dish-photo-close"
              onClick={closePhoto}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="dish-photo-frame">
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="dish-photo-nav dish-photo-prev"
                    onClick={previousPhoto}
                    aria-label="Предыдущая фотография"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className="dish-photo-nav dish-photo-next"
                    onClick={nextPhoto}
                    aria-label="Следующая фотография"
                  >
                    ›
                  </button>
                </>
              )}

              <img
                src={currentPhoto}
                alt={dish.name}
                className="dish-photo-large"
                style={{
                  transform: `scale(${zoom})`,
                }}
              />
            </div>

            <div className="dish-photo-caption">
              <strong>{dish.name}</strong>
              <span>{money(dish.price)}</span>
            </div>

            {photos.length > 1 && (
              <div className="dish-photo-counter">
                {photoIndex + 1} / {photos.length}
              </div>
            )}

            <div className="dish-photo-controls">
              <button
                type="button"
                onClick={zoomOut}
                aria-label="Уменьшить фотографию"
              >
                −
              </button>

              <span>
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={zoomIn}
                aria-label="Увеличить фотографию"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function CustomerCart({
  cart,
  total,
  onChange,
  onSubmit,
  comment,
  onCommentChange,
  onClose,
}) {
  return (
    <div className="customer-cart-overlay">
      <div className="customer-cart">
        <div className="customer-cart-header">
          <div>
            <div className="customer-eyebrow">
              МОЙ ЗАКАЗ
            </div>

            <h2>Ваш заказ</h2>
          </div>

          <button
            className="customer-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="customer-empty-cart">
            <div>□</div>
            <h3>Пока пусто</h3>
            <p>
              Добавьте блюда из меню.
            </p>
          </div>
        ) : (
          <>
            <div className="customer-cart-items">
              {cart.map((item) => (
                <div
                  className="customer-cart-item"
                  key={item.dishId}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {money(item.price)}
                    </span>
                  </div>

                  <div className="quantity-control">
                    <button
                      onClick={() =>
                        onChange(
                          item.dishId,
                          -1
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {item.quantity}
                    </strong>

                    <button
                      onClick={() =>
                        onChange(
                          item.dishId,
                          1
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="customer-comment">
              <label>Комментарий к заказу</label>
              <textarea
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="Например: без лука, соус отдельно..."
                maxLength={300}
              />
            </div>

            <div className="customer-cart-total">
              <span>Итого</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              className="customer-primary customer-checkout"
              onClick={onSubmit}
            >
              Оформить заказ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CustomerOrderTracking({ order }) {
  const [status, setStatus] = useState(order.status || "new");

  useEffect(() => {
    function sync() {
      try {
        const saved = readStorage(STORAGE.orders, []);
        const current = saved.find((item) => item.id === order.id);
        if (current) setStatus(current.status || "new");
      } catch {
        // Ignore storage errors.
      }
    }

    sync();
    const timer = window.setInterval(sync, 1000);
    window.addEventListener("storage", sync);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", sync);
    };
  }, [order.id]);

  const labels = {
    new: "Принят рестораном",
    accepted: "Заказ принят",
    preparing: "Готовится",
    assembled: "Собран",
    ready: "Готов к выдаче",
    completed: "Заказ выдан",
    cancelled: "Заказ отменён",
  };

  const steps = [
    ["new", "Принят"],
    ["preparing", "Готовится"],
    ["assembled", "Собран"],
    ["ready", "Готов"],
  ];

  const activeIndex = Math.max(
    0,
    steps.findIndex(([key]) => key === status)
  );

  return (
    <div className="customer-tracking">
      <div className="customer-tracking-title">
        <span>СТАТУС</span>
        <strong>{labels[status] || status}</strong>
      </div>

      <div className="customer-tracking-steps">
        {steps.map(([key, label], index) => (
          <div
            className={
              index <= activeIndex
                ? "customer-track-step active"
                : "customer-track-step"
            }
            key={key}
          >
            <span>{index < activeIndex ? "✓" : index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerError({ title, text }) {
  return (
    <div className="customer-error-page">
      <div className="customer-error-card">
        <div className="customer-logo">F</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   EMPTY
------------------------------------------------------- */

function EmptyState({
  icon,
  title,
  text,
  button,
  onClick,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>

      <h2>{title}</h2>

      <p>{text}</p>

      {button && onClick && (
        <button
          className="primary-button"
          onClick={onClick}
        >
          {button}
        </button>
      )}
    </div>
  );
}


/* -------------------------------------------------------
   PROFILE / QR STANDS / INVOICES
------------------------------------------------------- */

function ProfilePage({ restaurant, orders, setOrders, tables, invoices, setInvoices, onLogout }) {
  const [section, setSection] = useState("home");

  // Navigation inside the director profile must always start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [section]);

  const [, forceClock] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => forceClock(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  const [standOrders, setStandOrders] = useState(() =>
    readStorage(STORAGE.qrStands, []).filter((x) => x.restaurantId === restaurant.id)
  );

  useEffect(() => {
    const all = readStorage(STORAGE.qrStands, []);
    writeStorage(STORAGE.qrStands, [
      ...all.filter((x) => x.restaurantId !== restaurant.id),
      ...standOrders,
    ]);
  }, [standOrders, restaurant.id]);

  if (section === "orders") return <div className="profile-subpage"><SubpageHeader title="Заказы" onBack={() => setSection("home")} /><OrdersManager restaurant={restaurant} orders={orders} setOrders={setOrders} /></div>;
  if (section === "stands") return <QRStandOrderPage restaurant={restaurant} tables={tables} onBack={() => setSection("home")} standOrders={standOrders} setStandOrders={setStandOrders} />;
  if (section === "invoices") return <InvoicesPage restaurant={restaurant} invoices={invoices} setInvoices={setInvoices} onBack={() => setSection("home")} />;
  if (section === "reports") return <ReportsPage restaurant={restaurant} orders={orders} onBack={() => setSection("home")} />;

  const pending = invoices.filter((x) => x.restaurantId === restaurant.id && x.status !== "paid").length;
  const trialStarted = restaurant.trialStartedAt ? new Date(restaurant.trialStartedAt).getTime() : null;
  const trialLeft = trialStarted ? Math.max(0, TRIAL_HOURS * 60 - Math.floor((Date.now() - trialStarted) / 60000)) : TRIAL_HOURS * 60;
  const trialLabel = trialStarted ? `${Math.floor(trialLeft / 60)} ч ${trialLeft % 60} мин` : "5 часов";

  return (
    <div className="profile-page">
      <div className="page-heading"><div><div className="eyebrow">АККАУНТ</div><h1>Профиль</h1><p>{restaurant.name} · управление аккаунтом</p></div></div>
      {restaurant.subscriptionType === "perpetual" && restaurant.subscriptionActive ? (
        <div className="profile-trial-banner profile-perpetual-banner"><div><span>ЛИЦЕНЗИЯ FESTO</span><strong>Бессрочная</strong></div><p>Оплата подтверждена администратором. Пробный период отключен.</p></div>
      ) : (
        <div className="profile-trial-banner"><div><span>ПРОБНЫЙ ДОСТУП</span><strong>{trialLabel}</strong></div><p>После завершения пробного периода оплатите счет в разделе «Счета и оплаты».</p></div>
      )}
      <div className="profile-grid">
        <button className="profile-card" onClick={() => setSection("orders")}><span className="profile-card-icon"><Icon name="orders" size={26}/></span><strong>Заказы</strong><span>История и статусы заказов гостей</span><b>{orders.length}</b></button>
        <button className="profile-card" onClick={() => setSection("stands")}><span className="profile-card-icon"><Icon name="qr" size={26}/></span><strong>Заказать QR подставки</strong><span>Дизайн, логотип, цвет и конкретные столы</span><b>{standOrders.length}</b></button>
        <button className="profile-card" onClick={() => setSection("invoices")}><span className="profile-card-icon"><Icon name="bank" size={26}/></span><strong>Счета и оплаты</strong><span>Реквизиты, чеки и проверка платежей</span><b>{pending}</b></button>
        <button className="profile-card" onClick={() => setSection("reports")}><span className="profile-card-icon"><Icon name="chart" size={26}/></span><strong>Отчеты</strong><span>Скорость приготовления и товарооборот</span><b>↗</b></button>
      </div>
      <div className="profile-logout-wrap"><button className="profile-logout-button" onClick={onLogout}><Icon name="logout" size={18}/>Выйти из аккаунта</button></div>
    </div>
  );
}


function reportIntervalLabel(interval) {
  return ({last_hour:"Последний час", today:"Сегодня", yesterday:"Прошедший день", month:"Текущий месяц"}[interval] || interval);
}

function getReportRange(interval) {
  const now = Date.now();
  const d = new Date(now);
  if (interval === "last_hour") return { from: now - 60 * 60 * 1000, to: now };
  if (interval === "today") return { from: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), to: now };
  if (interval === "yesterday") {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime();
    return { from: start, to: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() };
  }
  return { from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to: now };
}

function ReportsPage({ restaurant, orders, onBack }) {
  const [interval, setInterval] = useState("today");
  const [type, setType] = useState("speed");
  const [report, setReport] = useState(null);

  // Switching between report builder and report result starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [report]);

  function buildReport() {
    const range = getReportRange(interval);
    const filtered = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return o.restaurantId === restaurant.id && t >= range.from && t < range.to && o.status !== "cancelled";
    });
    if (type === "turnover") {
      const turnover = filtered.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const avg = filtered.length ? turnover / filtered.length : 0;
      setReport({ type, interval, range, orders: filtered, turnover, avg });
      return;
    }
    const measured = filtered.map((o) => {
      const start = new Date(o.createdAt).getTime();
      const end = o.readyAt ? new Date(o.readyAt).getTime() : (o.statusChangedAt && o.status === "ready" ? new Date(o.statusChangedAt).getTime() : null);
      return end && end >= start ? (end - start) / 60000 : null;
    }).filter((x) => x != null);
    const avg = measured.length ? measured.reduce((a,b) => a+b, 0) / measured.length : 0;
    const fastest = measured.length ? Math.min(...measured) : 0;
    const slowest = measured.length ? Math.max(...measured) : 0;
    setReport({ type, interval, range, orders: filtered, measured, avg, fastest, slowest });
  }

  if (report) return <div className="profile-subpage report-result-page"><SubpageHeader title={report.type === "speed" ? "Отчет · Скорость приготовления" : "Отчет · Товарооборот"} onBack={() => setReport(null)} /><div className="report-result-head"><div><div className="eyebrow">{reportIntervalLabel(report.interval)}</div><h2>{restaurant.name}</h2><p>{new Date(report.range.from).toLocaleString("ru-RU")} — {new Date(report.range.to).toLocaleString("ru-RU")}</p></div><button className="secondary-button" onClick={() => setReport(null)}>Изменить отчет</button></div>{report.type === "speed" ? <div className="report-metrics"><div className="report-metric"><span>СРЕДНЕЕ ВРЕМЯ</span><strong>{report.avg.toFixed(1)} мин</strong><p>от создания до готовности</p></div><div className="report-metric"><span>САМЫЙ БЫСТРЫЙ</span><strong>{report.fastest.toFixed(1)} мин</strong><p>из измеренных заказов</p></div><div className="report-metric"><span>САМЫЙ ДОЛГИЙ</span><strong>{report.slowest.toFixed(1)} мин</strong><p>из измеренных заказов</p></div><div className="report-metric"><span>ЗАКАЗОВ</span><strong>{report.orders.length}</strong><p>в выбранном интервале</p></div></div> : <div className="report-metrics"><div className="report-metric"><span>ТОВАРООБОРОТ</span><strong>{money(report.turnover)}</strong><p>сумма заказов</p></div><div className="report-metric"><span>СРЕДНИЙ ЧЕК</span><strong>{money(report.avg)}</strong><p>на один заказ</p></div><div className="report-metric"><span>ЗАКАЗОВ</span><strong>{report.orders.length}</strong><p>в выбранном интервале</p></div></div>}<div className="glass-panel report-table-panel"><h3>Заказы в отчете</h3>{report.orders.length ? <div className="report-order-list">{report.orders.map(o => <div key={o.id}><span>#{String(o.number).padStart(4,"0")}</span><span>{new Date(o.createdAt).toLocaleString("ru-RU")}</span><span>{money(o.total)}</span><b>{o.status === "ready" || o.status === "completed" ? "Готов" : "В работе"}</b></div>)}</div> : <EmptyState icon="chart" title="Нет данных" text="В выбранном интервале нет заказов для формирования отчета."/>}</div></div>;

  return <div className="profile-subpage"><SubpageHeader title="Отчеты" onBack={onBack}/><div className="glass-panel reports-builder"><div className="eyebrow">АНАЛИТИКА РЕСТОРАНА</div><h2>Сформировать отчет</h2><p className="muted">Выберите интервал и тип отчета. После формирования откроется отдельная страница с результатами.</p><div className="report-form-grid"><div className="input-group"><label>Интервал</label><select value={interval} onChange={e=>setInterval(e.target.value)}><option value="last_hour">Последний час</option><option value="today">Сегодня</option><option value="yesterday">Прошедший день</option><option value="month">Текущий месяц</option></select></div><div className="input-group"><label>Отчет</label><select value={type} onChange={e=>setType(e.target.value)}><option value="speed">По скорости приготовления</option><option value="turnover">По товарообороту</option></select></div></div><button className="primary-button report-generate" onClick={buildReport}><Icon name="chart" size={18}/>Сформировать отчет</button></div></div>;
}

function AdminProfilePage({ restaurants, setRestaurants, invoices, setInvoices, onLogout }) {
  const [section, setSection] = useState("home");

  // Navigation inside the admin profile must always start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [section]);

  if (section === "invoices") return <AdminInvoicesPage restaurants={restaurants} setRestaurants={setRestaurants} invoices={invoices} setInvoices={setInvoices} onBack={() => setSection("home")} />;
  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">АККАУНТ</div>
          <h1>Профиль</h1>
          <p>Управление аккаунтом администратора</p>
        </div>
      </div>

      <div className="profile-grid">
        <button className="profile-card" onClick={() => setSection("invoices")}>
          <span className="profile-card-icon">
            <Icon name="bank" size={26}/>
          </span>
          <strong>Счета и оплаты</strong>
          <span>Выставляйте счета ресторанам и проверяйте платежи</span>
          <b>{invoices.filter(x => x.status === "payment_submitted").length}</b>
        </button>
      </div>

      <div className="profile-logout-wrap">
        <button
          className="profile-logout-button"
          onClick={onLogout}
          type="button"
        >
          <Icon name="logout" size={18}/>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

function QRStandOrderPage({ restaurant, tables, onBack, standOrders, setStandOrders }) {
  const [font, setFont] = useState("Inter");
  const [color, setColor] = useState("#ffffff");
  const [accent, setAccent] = useState("#111111");
  const [logo, setLogo] = useState("");
  const [selectedTables, setSelectedTables] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [sent, setSent] = useState(false);

  const toggleTable = (id) => setSelectedTables(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  function loadLogo(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file);
  }
  function submit() {
    if (!selectedTables.length) { alert("Выберите хотя бы один стол."); return; }
    const order = { id: uid("stand"), restaurantId: restaurant.id, tables: selectedTables, font, color, accent, logo, quantity, status: "new", createdAt: new Date().toISOString() };
    setStandOrders(prev => [order, ...prev]); setSent(true);
  }
  const previewTable = tables.find(t => selectedTables.includes(t.id)) || tables[0];
  const previewValue = previewTable ? customerUrl(previewTable.id, restaurant.id) : `${window.location.origin}/?restaurant=demo-restaurant&table=table-1`;

  if (sent) return <div className="profile-subpage"><SubpageHeader title="QR подставки" onBack={onBack}/><div className="success-card"><div className="success-icon"><Icon name="check" size={30}/></div><h2>Заявка отправлена</h2><p>Мы получили дизайн и список столов. Заказ будет обработан после подтверждения.</p><div className="info-box"><span>Столы</span><strong>{selectedTables.map(id => tables.find(t => t.id === id)?.name).filter(Boolean).join(", ")}</strong></div><button className="primary-button" onClick={onBack}>Вернуться в профиль</button></div></div>;

  return (
    <div className="profile-subpage">
      <SubpageHeader title="Заказать QR подставки" onBack={onBack}/>
      <div className="stand-layout">
        <div className="stand-form">
          <div className="glass-panel"><div className="eyebrow">1 · СТОЛЫ</div><h2>Для каких столов нужны подставки?</h2><p className="muted">QR берутся напрямую со страницы «Столы», поэтому каждый выбранный стол получает свой QR.</p><div className="table-select-grid">{tables.map(t => <button key={t.id} type="button" className={`table-select ${selectedTables.includes(t.id) ? "selected" : ""}`} onClick={() => toggleTable(t.id)}><span>{t.name}</span><small>Стол {t.number}</small>{selectedTables.includes(t.id) && <Icon name="check" size={18}/>}</button>)}</div></div>
          <div className="glass-panel"><div className="eyebrow">2 · ДИЗАЙН</div><h2>Оформление подставки</h2><div className="form-row"><div className="input-group"><label>Шрифт</label><select value={font} onChange={e => setFont(e.target.value)}><option>Inter</option><option>Georgia</option><option>Arial</option><option>Montserrat</option></select></div><div className="input-group"><label>Количество</label><input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}/></div></div><div className="form-row"><div className="input-group"><label>Цвет подставки</label><input className="color-input" type="color" value={color} onChange={e => setColor(e.target.value)}/></div><div className="input-group"><label>Цвет QR</label><input className="color-input" type="color" value={accent} onChange={e => setAccent(e.target.value)}/></div></div><div className="logo-upload"><input id="stand-logo" type="file" accept="image/*" onChange={loadLogo}/><label htmlFor="stand-logo"><Icon name="upload" size={18}/> {logo ? "Логотип загружен — заменить" : "Загрузить логотип"}</label><small>Логотип всегда размещается в левом верхнем углу подставки.</small></div></div>
          <div className="glass-panel"><div className="eyebrow">3 · ПРЕДПРОСМОТР</div><h2>Так будет выглядеть подставка</h2><p className="muted">QR сразу показан вместе с выбранным оформлением.</p><div className="stand-preview" style={{ background: color, color: accent, fontFamily: font }}><div className="stand-logo-slot">{logo ? <img src={logo} alt="Логотип"/> : <span>LOGO</span>}</div><div className="stand-title">{restaurant.name}</div><div className="stand-qr"><QRCodeSVG value={previewValue} size={220} bgColor="#ffffff" fgColor={accent} level="M" marginSize={5}/></div><div className="stand-table-label">{previewTable ? previewTable.name : "Выберите стол"}</div><div className="stand-hint">Наведите камеру, чтобы открыть меню</div></div></div>
          <button className="primary-button stand-submit" onClick={submit}>Отправить заявку на подставки</button>
        </div>
        <aside className="stand-summary glass-panel"><div className="eyebrow">ЗАКАЗ</div><h3>QR подставки</h3><p>{selectedTables.length} столов · {quantity} шт.</p><div className="summary-list">{selectedTables.map(id => <div key={id}><span>{tables.find(t => t.id === id)?.name}</span><span>QR ✓</span></div>)}</div></aside>
      </div>
    </div>
  );
}

function InvoicesPage({ restaurant, invoices, setInvoices, onBack }) {
  const mine = invoices.filter(x => x.restaurantId === restaurant.id);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState("");
  function uploadReceipt(e) { const file=e.target.files?.[0]; if(!file)return; const r=new FileReader(); r.onload=()=>setReceipt(String(r.result)); r.readAsDataURL(file); }
  function submitPayment() { if(!selected || !receipt){alert("Загрузите чек об оплате.");return;} setInvoices(prev=>prev.map(x=>x.id===selected.id?{...x,status:"payment_submitted",receiptData:receipt,submittedAt:new Date().toISOString()}:x)); setSelected(null); setReceipt(""); }
  return <div className="profile-subpage"><SubpageHeader title="Счета и оплаты" onBack={onBack}/><div className="billing-note"><Icon name="bank" size={20}/><div><strong>Оплата только переводом на банковский счёт</strong><span>После перевода прикрепите чек. Администратор проверяет платеж вручную, обычно в течение 10 минут.</span></div></div>{mine.length===0?<EmptyState icon="bank" title="Счетов пока нет" text="Когда администратор выставит счет, он появится здесь."/>:<div className="invoice-list">{mine.map(inv=><div className="invoice-card" key={inv.id}><div><div className="eyebrow">СЧЕТ · {inv.number}</div><h3>{inv.title}</h3><p>{inv.description}</p><strong>{money(inv.amount)}</strong></div><div className={`invoice-status status-${inv.status}`}>{invoiceStatus(inv.status)}</div>{inv.status !== "paid" && inv.status !== "payment_submitted" && <button className="primary-button" onClick={()=>{setSelected(inv);setReceipt("")}}>Оплатить и отправить чек</button>}{inv.status === "payment_submitted" && <div className="invoice-wait">Чек отправлен · проверка до 10 минут</div>}{inv.status === "paid" && <div className="invoice-paid">Оплата подтверждена</div>}<div className="requisites"><b>Реквизиты для перевода</b><span>{inv.requisites}</span></div></div>)}</div>}{selected&&<div className="modal-backdrop"><div className="modal-card"><button className="icon-button modal-close" onClick={()=>setSelected(null)}><Icon name="close"/></button><div className="eyebrow">ОПЛАТА СЧЕТА</div><h2>{selected.title}</h2><div className="payment-amount">{money(selected.amount)}</div><div className="requisites"><b>Переведите средства по реквизитам</b><span>{selected.requisites}</span></div><div className="logo-upload"><input id="receipt-upload" type="file" accept="image/*,.pdf" onChange={uploadReceipt}/><label htmlFor="receipt-upload"><Icon name="upload" size={18}/> {receipt?"Чек загружен":"Загрузить чек"}</label></div><button className="primary-button" onClick={submitPayment}>Отправить платеж на проверку</button></div></div>}</div>;
}

function AdminInvoicesPage({ restaurants, setRestaurants, invoices, setInvoices, onBack }) {
  const [form, setForm] = useState({restaurantId: restaurants[0]?.id || "", title:"", amount:"", description:"", requisites:DEFAULT_PAYMENT_REQUISITES});

  function createInvoice(){
    if(!form.restaurantId||!form.title||!form.amount||!form.requisites){alert("Заполните ресторан, название, сумму и реквизиты.");return;}
    setInvoices(prev=>[{id:uid("invoice"),number:String(Math.floor(1000+Math.random()*9000)),...form,amount:Number(form.amount),status:"pending_payment",createdAt:new Date().toISOString()},...prev]);
    setForm({...form,title:"",amount:"",description:"",requisites:DEFAULT_PAYMENT_REQUISITES});
  }

  function review(id,status){
    const invoice = invoices.find(x => x.id === id);
    if (!invoice) return;
    const reviewedAt = new Date().toISOString();
    setInvoices(prev=>prev.map(x=>x.id===id?{...x,status,reviewedAt}:x));
    const isSubscriptionInvoice =
      invoice.type === "subscription" ||
      invoice.title === "Лицензия и программное обеспечение FESTO";

    if (status === "paid" && isSubscriptionInvoice) {
      // A confirmed subscription payment permanently activates the restaurant.
      // Explicitly remove every trial marker so the trial gate can never return.
      setRestaurants(prev => prev.map(r => r.id === invoice.restaurantId ? {
        ...r,
        subscriptionActive: true,
        subscriptionType: "perpetual",
        trialStartedAt: null,
        trialDurationHours: 0,
        trialEndsAt: null,
        subscriptionPaidAt: reviewedAt,
        paidInvoiceId: invoice.id,
      } : r));
    }
  }
  return <div className="profile-subpage"><SubpageHeader title="Счета и оплаты" onBack={onBack}/><div className="admin-billing-layout"><div className="glass-panel"><div className="eyebrow">АДМИНИСТРАТОР</div><h2>Выставить новый счет</h2><div className="input-group"><label>Ресторан</label><select value={form.restaurantId} onChange={e=>setForm({...form,restaurantId:e.target.value})}>{restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="input-group"><label>Название счета</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Например: QR-подставки"/></div><div className="form-row"><div className="input-group"><label>Сумма, ₽</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div><div className="input-group"><label>Описание</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="За что выставлен счет"/></div></div><div className="input-group"><label>Реквизиты для перевода</label><textarea value={form.requisites} onChange={e=>setForm({...form,requisites:e.target.value})} placeholder="Банк, получатель, номер счета..."/></div><button className="primary-button" onClick={createInvoice}>Выставить счет</button></div><div className="invoice-list admin-invoice-list">{invoices.length===0?<EmptyState icon="bank" title="Счетов нет" text="Создайте первый счет для ресторана."/>:invoices.map(inv=><div className="invoice-card" key={inv.id}><div><div className="eyebrow">СЧЕТ · {inv.number}</div><h3>{inv.title}</h3><p>{restaurants.find(r=>r.id===inv.restaurantId)?.name}</p><strong>{money(inv.amount)}</strong></div><div className={`invoice-status status-${inv.status}`}>{invoiceStatus(inv.status)}</div><div className="requisites"><b>Реквизиты</b><span>{inv.requisites}</span></div>{inv.receiptData&&<div className="receipt-preview"><span>Чек приложен</span>{String(inv.receiptData).startsWith("data:image")&&<img src={inv.receiptData} alt="Чек"/>}</div>}{inv.status === "payment_submitted"&&<div className="review-actions"><button className="primary-button" onClick={()=>review(inv.id,"paid")}>Подтвердить оплату</button><button className="danger-button" onClick={()=>review(inv.id,"rejected")}>Отклонить</button></div>}</div>)}</div></div></div>;
}

function invoiceStatus(status){return ({pending_payment:"Ожидает оплаты",payment_submitted:"На проверке",paid:"Оплачен",rejected:"Отклонен"}[status]||status);}

/* -------------------------------------------------------
   MOBILE BAR
------------------------------------------------------- */

function MobileBar({ page, setPage, role }) {
  const items = role === "admin"
    ? [["dashboard", "Главная", "home"], ["restaurants", "Рестораны", "restaurant"], ["licenses", "Лицензии", "license"], ["profile", "Профиль", "profile"]]
    : [["dashboard", "Главная", "home"], ["menu", "Меню", "menu"], ["tables", "Столы", "grid"], ["profile", "Профиль", "profile"]];
  return <div className="mobile-bar">{items.map(([id, label, icon]) => <button key={id} className={page === id ? "mobile-active" : ""} onClick={() => setPage(id)} type="button"><Icon name={icon} size={22} strokeWidth={1.9} /><span>{label}</span></button>)}</div>;
}

/* -------------------------------------------------------
   PAGE TITLES
------------------------------------------------------- */

function getAdminPageTitle(page) {
  const titles = {
    dashboard: "Главная",
    restaurants: "Рестораны",
    licenses: "Лицензии",
    "restaurant-details": "Ресторан",
    settings: "Настройки",
    profile: "Профиль",
  };

  return titles[page] || "Festo";
}

function getDirectorPageTitle(page) {
  const titles = {
    dashboard: "Главная",
    menu: "Меню",
    tables: "Столы",
    orders: "Заказы",
    profile: "Профиль",
    settings: "Настройки",
  };

  return titles[page] || "Festo";
}

/* -------------------------------------------------------
   LIVE ORDERS SCREEN
------------------------------------------------------- */

function LiveOrdersScreen({
  restaurant,
  orders,
  setOrders,
}) {
  const [liveOrders, setLiveOrders] = useState(() => normalizeLiveOrders(orders, restaurant.id));
  const [page, setPage] = useState(0);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [clock, setClock] = useState(Date.now());
  const previousIds = React.useRef(new Set());
  const initialized = React.useRef(false);
  const audioContext = React.useRef(null);

  function normalizeLiveOrders(source, restaurantId) {
    return source
      .filter((order) => order.restaurantId === restaurantId)
      .filter((order) => order.status !== "completed" && order.status !== "cancelled" && order.status !== "ready")
      .map((order) => ({
        ...order,
        // В кухонном режиме новый/принятый заказ сразу считается готовящимся.
        liveStatus:
          order.status === "assembled"
            ? "assembled"
            : order.status === "ready"
              ? "ready"
              : "preparing",
      }))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  useEffect(() => {
    function handleResize() {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== STORAGE.orders) return;

      try {
        setLiveOrders(
          normalizeLiveOrders(JSON.parse(event.newValue || "[]"), restaurant.id)
        );
      } catch {
        // Ignore malformed localStorage data.
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [restaurant.id]);

  useEffect(() => {
    setLiveOrders(normalizeLiveOrders(orders, restaurant.id));
  }, [orders, restaurant.id]);

  useEffect(() => {
    let cancelled = false;

    const loadLiveOrders = () => {
      festoApi(
        `/api/orders?restaurantId=${encodeURIComponent(restaurant.id)}`
      )
        .then((remote) => {
          if (!cancelled && Array.isArray(remote?.orders)) {
            setOrders(remote.orders);
          }
        })
        .catch(() => {});
    };

    loadLiveOrders();

    const timer = window.setInterval(loadLiveOrders, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [restaurant.id]);

  useEffect(() => {
    const ids = new Set(liveOrders.map((order) => order.id));

    if (initialized.current) {
      const hasNewOrder = [...ids].some((id) => !previousIds.current.has(id));
      if (hasNewOrder) {
        setPage(0);
        playNewOrderSound();
      }
    }

    previousIds.current = ids;
    initialized.current = true;
  }, [liveOrders]);

  function playNewOrderSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContext.current) {
        audioContext.current = new AudioCtx();
      }

      const ctx = audioContext.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      [0, 0.14, 0.28].forEach((offset, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = index === 2 ? 880 : 660;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.12);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.13);
      });
    } catch {
      // Browser can block audio until user interaction.
    }
  }

  const columns = Math.max(1, Math.floor(viewport.width / 310));
  const availableHeight = Math.max(420, viewport.height - 125);
  const rows = Math.max(1, Math.floor(availableHeight / 335));
  const pageSize = Math.max(1, columns * rows);
  const totalPages = Math.max(1, Math.ceil(liveOrders.length / pageSize));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const visibleOrders = liveOrders.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function elapsedMinutes(order) {
    const start = new Date(order.createdAt).getTime();
    const diff = Math.max(0, clock - start);
    return Math.floor(diff / 60000);
  }

  function elapsedLabel(order) {
    const start = new Date(order.createdAt).getTime();
    const diff = Math.max(0, clock - start);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function updateOrderStatus(id, status) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              statusChangedAt: new Date().toISOString(),
              ...(status === "assembled" && !order.assembledAt ? { assembledAt: new Date().toISOString() } : {}),
              ...(status === "ready" ? { readyAt: new Date().toISOString() } : {}),
              ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}),
            }
          : order
      )
    );
    const next = orders.find((order) => order.id === id);
    if (next) {
      const updated = { ...next, status, statusChangedAt: new Date().toISOString(), ...(status === "assembled" && !next.assembledAt ? { assembledAt: new Date().toISOString() } : {}), ...(status === "ready" ? { readyAt: new Date().toISOString() } : {}), ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}) };
      festoApi(`/api/orders/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(updated) }).catch(() => {});
    }
  }

  function handleOrderClick(order) {
    const current = order.liveStatus || "preparing";

    // Первый клик: заказ собран + голубая подсветка.
    if (current === "preparing") {
      updateOrderStatus(order.id, "assembled");
      return;
    }

    // Второй клик: заказ готов.
    if (current === "assembled") {
      updateOrderStatus(order.id, "ready");
    }
  }

  function statusLabel(status) {
    if (status === "assembled") return "СОБРАН";
    if (status === "ready") return "ГОТОВ";
    return "ГОТОВИТСЯ";
  }

  return (
    <div className="live-orders-screen">
      <header className="live-orders-header">
        <div className="live-header-left">
          <div className="live-brand">
            <div className="live-brand-logo">F</div>
            <div>
              <strong>{restaurant.name}</strong>
              <span>Кухня · Live-заказы</span>
            </div>
          </div>

          <div className="live-divider" />

          <div className="live-title">
            <h1>ЗАКАЗЫ</h1>
            <div className="live-status">
              <span className="live-pulse" />
              LIVE
            </div>
          </div>
        </div>

        <div className="live-header-right">
          <div className="live-counter">
            <span>АКТИВНЫЕ ЗАКАЗЫ</span>
            <strong>{liveOrders.length}</strong>
          </div>

          {totalPages > 1 && (
            <div className="live-pagination">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Предыдущая страница"
              >
                ←
              </button>
              <span>{page + 1} / {totalPages}</span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page === totalPages - 1}
                aria-label="Следующая страница"
              >
                →
              </button>
            </div>
          )}
        </div>
      </header>

      <main
        className="live-orders-grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(300px, 330px)",
        }}
      >
        {visibleOrders.map((order) => {
          const currentStatus = order.liveStatus || "preparing";
          const minutes = elapsedMinutes(order);
          const overdue = currentStatus === "preparing" && minutes >= 15;

          return (
            <article
              className={`live-order-card live-status-${currentStatus} ${
                overdue ? "live-order-overdue" : ""
              }`}
              key={order.id}
              onClick={() => handleOrderClick(order)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOrderClick(order);
                }
              }}
              title={
                currentStatus === "preparing"
                  ? "Нажмите, когда заказ собран"
                  : currentStatus === "assembled"
                    ? "Нажмите ещё раз, когда заказ готов"
                    : "Заказ готов"
              }
            >
              <div className="live-order-card-header">
                <div>
                  <div className="live-order-number">
                    #{String(order.number).padStart(4, "0")}
                  </div>
                  <div className="live-order-time">
                    {formatTime(order.createdAt)}
                  </div>
                </div>

                <div className="live-table-badge">
                  <span>СТОЛ</span>
                  <strong>
                    {order.tableNumber || order.tableName || "—"}
                  </strong>
                </div>
              </div>

              <div className="live-order-status-row">
                <div className="live-order-status">
                  {statusLabel(currentStatus)}
                </div>
                <div className="live-order-timer">{elapsedLabel(order)}</div>
              </div>

              <div className="live-order-items">
                {order.items.map((item, index) => (
                  <div
                    className="live-order-item"
                    key={`${item.dishId}-${index}`}
                  >
                    <div className="live-item-name">
                      <strong>{item.quantity} ×</strong>
                      <span>{item.name}</span>
                    </div>
                    <strong>{money(item.quantity * item.price)}</strong>
                  </div>
                ))}
              </div>

              <div className="live-order-footer">
                <div>
                  <span>ИТОГО</span>
                  <strong>{money(order.total)}</strong>
                </div>

                <div className="live-action-hint">
                  {currentStatus === "preparing"
                    ? "НАЖМИТЕ — СОБРАН"
                    : currentStatus === "assembled"
                      ? "НАЖМИТЕ — ГОТОВ"
                      : "ЗАКАЗ ГОТОВ"}
                </div>
              </div>
            </article>
          );
        })}

        {visibleOrders.length === 0 && (
          <div className="live-empty">
            <div className="live-empty-icon">✓</div>
            <h2>Все заказы обработаны</h2>
            <p>Новые заказы появятся здесь автоматически</p>
            <div className="live-waiting">
              <span className="live-pulse" />
              Ожидание новых заказов
            </div>
          </div>
        )}
      </main>

      {totalPages > 1 && (
        <footer className="live-orders-footer">
          <div>
            Страница <strong>{page + 1}</strong> из <strong>{totalPages}</strong>
          </div>
          <div className="live-page-dots">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={index === page ? "active" : ""}
                onClick={() => setPage(index)}
                aria-label={`Страница ${index + 1}`}
              />
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}


/* -------------------------------------------------------
   MAIN APP
------------------------------------------------------- */

export default function App() {
  const [restaurants, setRestaurants] = useState(() =>
    readStorage(
      STORAGE.restaurants,
      [DEFAULT_RESTAURANT]
    )
  );

  const [categories, setCategories] = useState(() =>
    readStorage(
      STORAGE.categories,
      DEFAULT_CATEGORIES
    )
  );

  const [dishes, setDishes] = useState(() =>
    readStorage(
      STORAGE.dishes,
      DEFAULT_DISHES
    )
  );

  const [tables, setTables] = useState(() =>
    readStorage(
      STORAGE.tables,
      DEFAULT_TABLES
    )
  );

  const [orders, setOrders] = useState(() =>
    readStorage(STORAGE.orders, [])
  );

  const [invoices, setInvoices] = useState(() =>
    readStorage(STORAGE.invoices, [])
  );

  const [session, setSession] = useState(() =>
    readStorage(STORAGE.session, null)
  );
  const [now, setNow] = useState(Date.now());
  const [sharedDataLoaded, setSharedDataLoaded] = useState(false);

  // Однократная миграция старых больших Base64-фотографий блюд.
  // Сжимает только изображения > 300 KB, обычные URL и маленькие картинки не трогает.
  useEffect(() => {
    let cancelled = false;

    const compressImage = (src) =>
      new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          try {
            const maxSide = 1000;
            const scale = Math.min(
              1,
              maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
            canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) {
              reject(new Error("Canvas недоступен"));
              return;
            }

            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          } catch (error) {
            reject(error);
          }
        };

        image.onerror = () => reject(new Error("Не удалось загрузить изображение"));
        image.src = src;
      });

    const migrate = async () => {
      const source = dishes;

      if (!Array.isArray(source) || !source.length) return;

      let changed = false;
      const next = [];

      for (const dish of source) {
        if (cancelled) return;

        const image = String(dish?.image || "");

        if (
          image.startsWith("data:image/") &&
          image.length > 300 * 1024
        ) {
          try {
            const compressed = await compressImage(image);

            if (
              compressed &&
              compressed.length < image.length * 0.8
            ) {
              next.push({
                ...dish,
                image: compressed,
              });
              changed = true;
              continue;
            }
          } catch (error) {
            console.warn(
              "FESTO: не удалось сжать изображение блюда",
              dish?.name || dish?.id,
              error
            );
          }
        }

        next.push(dish);
      }

      if (!cancelled && changed) {
        setDishes(next);
        console.info("FESTO: старые фотографии блюд сжаты.");
      }
    };

    migrate();

    return () => {
      cancelled = true;
    };
  }, [sharedDataLoaded]);


  // Safety net: every newly created restaurant automatically receives one subscription invoice.
  useEffect(() => {
    const missing = restaurants.filter(r => r.id !== "demo-restaurant" && !invoices.some(i => i.restaurantId === r.id && i.type === "subscription"));
    if (!missing.length) return;
    setInvoices(prev => [
      ...missing.map(r => ({
        id: uid("invoice"),
        number: `F-${new Date().getFullYear()}-${String(Date.now() + Math.random()).slice(-6)}`,
        restaurantId: r.id,
        title: "Лицензия и программное обеспечение FESTO",
        amount: SUBSCRIPTION_PRICE,
        description: "Подключение ресторана и бессрочная лицензия FESTO после подтверждения оплаты.",
        requisites: DEFAULT_PAYMENT_REQUISITES,
        status: "pending_payment",
        type: "subscription",
        createdAt: new Date().toISOString(),
      })),
      ...prev,
    ]);
  }, [restaurants, invoices]);

  // Migration/safety net: if an older build already stored a paid subscription
  // invoice without the current restaurant flags, activate it now as perpetual.
  useEffect(() => {
    const paidSubscriptions = invoices.filter(i =>
      i.status === "paid" &&
      (i.type === "subscription" || i.title === "Лицензия и программное обеспечение FESTO")
    );
    if (!paidSubscriptions.length) return;

    setRestaurants(prev => {
      let changed = false;
      const next = prev.map(r => {
        const paid = paidSubscriptions
          .filter(i => i.restaurantId === r.id)
          .sort((a, b) => String(b.reviewedAt || b.createdAt || "").localeCompare(String(a.reviewedAt || a.createdAt || "")))[0];
        if (!paid) return r;
        if (r.subscriptionActive === true && r.subscriptionType === "perpetual" &&
            r.trialStartedAt == null && r.trialDurationHours === 0 && r.trialEndsAt == null) return r;
        changed = true;
        return {
          ...r,
          subscriptionActive: true,
          subscriptionType: "perpetual",
          trialStartedAt: null,
          trialDurationHours: 0,
          trialEndsAt: null,
          subscriptionPaidAt: r.subscriptionPaidAt || paid.reviewedAt || paid.createdAt || new Date().toISOString(),
          paidInvoiceId: paid.id,
        };
      });
      return changed ? next : prev;
    });
  }, [invoices]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  function handleLogin(nextSession) {
    if (nextSession.role === "director") {
      setRestaurants((prev) => prev.map((r) => r.id === nextSession.restaurantId && !r.trialStartedAt ? { ...r, trialStartedAt: new Date().toISOString() } : r));
    }
    setSession(nextSession);
    writeStorage(STORAGE.session, nextSession);
  }

  const urlParams = useMemo(() => {
    return new URLSearchParams(
      window.location.search
    );
  }, []);

  const tableFromUrl = urlParams.get("table");
  const restaurantFromUrl = urlParams.get("restaurant");
  const miniAppMatch =
    window.location.hash.match(/^#\/mini-app\/([^/?#]+)\/?$/);

  const publicMenuPayload = urlParams.get("festoMenu");
  const publicMenuData = publicMenuPayload ? festoBase64Decode(publicMenuPayload) : null;
  const liveOrdersRestaurantId =
    urlParams.get("liveOrders");
  const menuPathMatch = window.location.pathname.match(/\/menu\/([^/]+)\/([^/]+)\/?$/);
  const hashMenuMatch = window.location.hash.match(/^#\/menu\/([^/]+)\/([^/]+)\/?$/);
  const tbankResult = urlParams.get("tbank");
  const tbankRestaurantId = urlParams.get("restaurant");
  const tbankTableId = urlParams.get("table");

  const publicMenuMatch = menuPathMatch || hashMenuMatch;

  const publicMenuRoute = publicMenuMatch
    ? {
        restaurantId: decodeURIComponent(publicMenuMatch[1]),
        tableId: decodeURIComponent(publicMenuMatch[2]),
      }
    : tbankResult &&
        tbankRestaurantId &&
        tbankTableId
      ? {
          restaurantId: tbankRestaurantId,
          tableId: tbankTableId,
        }
      : null;
  const [publicRouteData, setPublicRouteData] = useState(null);
  const [publicRouteError, setPublicRouteError] = useState("");

  useEffect(() => {
    if (!publicMenuRoute) return;
    let cancelled = false;
    festoApi(`/api/public-menu/${encodeURIComponent(publicMenuRoute.restaurantId)}/${encodeURIComponent(publicMenuRoute.tableId)}`)
      .then((data) => { if (!cancelled) setPublicRouteData(data); })
      .catch(() => { if (!cancelled) setPublicRouteError("Не удалось загрузить меню. Проверьте, что сервер FESTO запущен."); });
    return () => { cancelled = true; };
  }, [publicMenuRoute?.restaurantId, publicMenuRoute?.tableId]);

  // Загружаем общую базу FESTO при каждом открытии приложения.
  // Благодаря этому ПК и мобильный телефон используют одни и те же
  // рестораны, аккаунты, категории, блюда и столы.
  useEffect(() => {
    let cancelled = false;

    festoApi("/api/sync")
      .then((remote) => {
        if (cancelled) return;

        if (Array.isArray(remote?.restaurants)) {
          setRestaurants((prev) => {
            const map = new Map(prev.filter((item) => item?.id).map((item) => [item.id, item]));
            for (const item of remote.restaurants) {
              if (item?.id) map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }

        if (Array.isArray(remote?.categories)) {
          setCategories((prev) => {
            const map = new Map(prev.filter((item) => item?.id).map((item) => [item.id, item]));
            for (const item of remote.categories) {
              if (item?.id) map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }

        if (Array.isArray(remote?.dishes)) {
          setDishes((prev) => {
            const map = new Map(prev.filter((item) => item?.id).map((item) => [item.id, item]));
            for (const item of remote.dishes) {
              if (item?.id) map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }

        if (Array.isArray(remote?.tables)) {
          setTables((prev) => {
            const map = new Map(prev.filter((item) => item?.id).map((item) => [item.id, item]));
            for (const item of remote.tables) {
              if (item?.id) map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }

        setSharedDataLoaded(true);
      })
      .catch(() => {
        // Если сервер временно недоступен, приложение продолжает работать
        // с локальными данными.
        if (!cancelled) setSharedDataLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session?.role || !sharedDataLoaded) return;
    // Синхронизируем справочники с общим сервером. Гость никогда не отправляет
    // свои локальные данные обратно на сервер и не может затереть меню ресторана.
    const timer = window.setTimeout(() => {
      festoApi("/api/sync", { method: "POST", body: JSON.stringify({ restaurants, categories, dishes, tables }) }).catch(() => {});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [session?.role, sharedDataLoaded, restaurants, categories, dishes, tables]);

  useEffect(() => {
    if (session?.role !== "director" || !session.restaurantId) return;
    let cancelled = false;
    const load = () => festoApi(`/api/orders?restaurantId=${encodeURIComponent(session.restaurantId)}`)
      .then((remote) => { if (!cancelled && Array.isArray(remote?.orders)) setOrders(remote.orders); })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 1500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [session?.role, session?.restaurantId]);

  useEffect(() => {
    writeStorage(
      STORAGE.restaurants,
      restaurants
    );
  }, [restaurants]);

  useEffect(() => {
    writeStorage(
      STORAGE.categories,
      categories
    );
  }, [categories]);

  useEffect(() => {
    writeStorage(STORAGE.dishes, dishes);
  }, [dishes]);

  useEffect(() => {
    writeStorage(STORAGE.tables, tables);
  }, [tables]);

  useEffect(() => {
    writeStorage(STORAGE.orders, orders);
  }, [orders]);

  useEffect(() => {
    writeStorage(STORAGE.invoices, invoices);
  }, [invoices]);

  /*
   * Важная защита от бага предыдущей версии:
   * email администратора НИКОГДА не используется
   * как login директора.
   */
  useEffect(() => {
    setRestaurants((prev) =>
      prev.map((restaurant) => {
        if (
          restaurant.login?.trim().toLowerCase() ===
          ADMIN_EMAIL.toLowerCase()
        ) {
          return {
            ...restaurant,
            login: `director-${restaurant.id.slice(
              0,
              5
            )}`,
          };
        }

        return restaurant;
      })
    );
  }, []);

  if (miniAppMatch) {
    return <TelegramMiniAppPage />;
  }

  if (publicMenuRoute) {
    if (publicRouteError) return <CustomerError title="Меню временно недоступно" text={publicRouteError} />;
    if (!publicRouteData) return <div
      className="customer-page"
      style={{
        "--customer-accent": "#6C4BF4",
        "--customer-background": "#F7F5F2",
      }}
    ><div className="customer-content"><div className="glass-panel"><h2>Загружаем меню…</h2><p className="muted">Подключаемся к FESTO.</p></div></div></div>;
    return (
      <CustomerApp
        restaurant={publicRouteData.restaurant}
        categories={publicRouteData.categories || []}
        dishes={publicRouteData.dishes || []}
        tables={[publicRouteData.table]}
        setOrders={setOrders}
        publicData={publicRouteData}
      />
    );
  }

  // Новый QR содержит публичный снимок меню и стола прямо в URL.
  // Он работает на телефоне гостя независимо от localStorage директора.
  if (publicMenuData?.restaurant?.id && publicMenuData?.table?.id) {
    return (
      <CustomerApp
        restaurant={publicMenuData.restaurant}
        categories={publicMenuData.categories || []}
        dishes={publicMenuData.dishes || []}
        tables={[publicMenuData.table]}
        setOrders={setOrders}
        publicData={publicMenuData}
      />
    );
  }

  // Совместимость со старыми QR.
  if (tableFromUrl) {
    const table = tables.find(
      (item) =>
        item.id === tableFromUrl &&
        (!restaurantFromUrl || item.restaurantId === restaurantFromUrl)
    );

    if (table) {
      const restaurant = restaurants.find(
        (item) =>
          item.id === table.restaurantId &&
          (!restaurantFromUrl || item.id === restaurantFromUrl)
      );

      if (restaurant) {
        return (
          <CustomerApp
            restaurant={restaurant}
            categories={categories}
            dishes={dishes}
            tables={tables}
            setOrders={setOrders}
          />
        );
      }
    }
  }

  if (liveOrdersRestaurantId) {
    const liveRestaurant = restaurants.find(
      (restaurant) =>
        restaurant.id === liveOrdersRestaurantId
    );

    if (liveRestaurant) {
      return (
        <LiveOrdersScreen
          restaurant={liveRestaurant}
          orders={orders}
          setOrders={setOrders}
        />
      );
    }
  }

  if (!session) {
    return (
      <Auth
        restaurants={restaurants}
        onLogin={handleLogin}
      />
    );
  }

  function logout() {
    setSession(null);
    try {
      localStorage.removeItem(STORAGE.session);
    } catch (error) {
      console.error("FESTO session storage cleanup failed:", error);
    }
  }

  if (session.role === "admin") {
    return (
      <AdminApp
        restaurants={restaurants}
        setRestaurants={setRestaurants}
        categories={categories}
        dishes={dishes}
        tables={tables}
        orders={orders}
        setTables={setTables}
        setOrders={setOrders}
        invoices={invoices}
        setInvoices={setInvoices}
        onLogout={logout}
      />
    );
  }

  const directorRestaurant = restaurants.find(
    (restaurant) =>
      restaurant.id === session.restaurantId
  );

  if (directorRestaurant) {
    const trialStarted = directorRestaurant.trialStartedAt ? new Date(directorRestaurant.trialStartedAt).getTime() : Date.now();
    const trialExpired = now - trialStarted >= TRIAL_HOURS * 60 * 60 * 1000;
    if (!directorRestaurant.licenseAcceptedAt) {
      return <LicenseAgreementGate restaurant={directorRestaurant} onAccept={() => { setRestaurants(prev => prev.map(r => r.id === directorRestaurant.id ? { ...r, licenseAcceptedAt: new Date().toISOString() } : r)); }} onLogout={logout} />;
    }
    if (trialExpired && !directorRestaurant.subscriptionActive) {
      return <TrialExpiredGate restaurant={directorRestaurant} invoices={invoices} setInvoices={setInvoices} onLogout={logout} />;
    }
  }

  return (
    <DirectorApp
      restaurant={directorRestaurant}
      categories={categories}
      setCategories={setCategories}
      dishes={dishes}
      setDishes={setDishes}
      tables={tables}
      setTables={setTables}
      orders={orders}
      setOrders={setOrders}
      restaurants={restaurants}
      setRestaurants={setRestaurants}
      invoices={invoices}
      setInvoices={setInvoices}
      onLogout={logout}
    />
  );
}