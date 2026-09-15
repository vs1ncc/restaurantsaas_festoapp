import React, { useState } from "react";

const FESTO_API_URL = "https://restaurantsaas-festoapp.vercel.app";

export default function App({ telegram }) {
  const [screen, setScreen] = useState("home");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const user = telegram?.initDataUnsafe?.user;
  const firstName = user?.first_name || "гость";

  const [form, setForm] = useState({
    legalName: "",
    inn: "",
    phone: "",
    name: "",
    address: "",
    bik: "",
    bankName: "",
    settlementAccount: "",
    correspondentAccount: "",
  });

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function startTrial(event) {
    event.preventDefault();
    setError("");

    const required = [
      "legalName",
      "inn",
      "phone",
      "name",
      "address",
      "bik",
      "bankName",
      "settlementAccount",
      "correspondentAccount",
    ];

    if (required.some((field) => !form[field].trim())) {
      setError("Заполните все поля.");
      return;
    }

    if (!telegram?.initData) {
      setError("Откройте FESTO именно внутри Telegram.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${FESTO_API_URL}/api/telegram/trial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initData: telegram.initData,
          legalName: form.legalName.trim(),
          inn: form.inn.trim(),
          phone: form.phone.trim(),
          name: form.name.trim(),
          address: form.address.trim(),
          bankDetails: {
            bik: form.bik.trim(),
            bankName: form.bankName.trim(),
            settlementAccount: form.settlementAccount.trim(),
            correspondentAccount: form.correspondentAccount.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Не удалось создать пробный доступ."
        );
      }

      setResult(data);
      setScreen("success");
    } catch (err) {
      setError(err?.message || "Ошибка соединения с FESTO.");
    } finally {
      setSaving(false);
    }
  }

  if (screen === "success") {
    return (
      <main className="app">
        <header className="topbar">
          <span className="logo">FESTO</span>
        </header>

        <section className="page">
          <div className="trial-icon">🎉</div>
          <div className="eyebrow">FESTO АКТИВИРОВАН</div>
          <h1>Пробный доступ запущен</h1>
          <p className="subtitle">
            Ресторан создан в системе FESTO.
          </p>

          <div className="trial-card">
            <div className="trial-content">
              <div className="trial-label">24 ЧАСА</div>
              <h2>Бесплатный доступ</h2>
              <p>
                До {new Date(result.trialEndsAt).toLocaleString("ru-RU")}
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "trial") {
    return (
      <main className="app">
        <header className="topbar">
          <button
            className="back-button"
            onClick={() => setScreen("home")}
            disabled={saving}
          >
            ←
          </button>
          <span className="logo">FESTO</span>
        </header>

        <section className="page">
          <div className="eyebrow">БЕСПЛАТНЫЙ ДОСТУП</div>
          <h1>Данные ресторана</h1>
          <p className="subtitle">
            Заполните те же данные, которые используются при создании
            ресторана в FESTO.
          </p>

          {error && <div className="error">{error}</div>}

          <form onSubmit={startTrial}>
            <div className="form-section">
              <h3>Юридическая информация</h3>

              <div className="input-group">
                <label>Юридическое название *</label>
                <input
                  value={form.legalName}
                  onChange={(e) => update("legalName", e.target.value)}
                  placeholder="ООО «Название»"
                  disabled={saving}
                />
              </div>

              <div className="input-group">
                <label>ИНН *</label>
                <input
                  value={form.inn}
                  onChange={(e) => update("inn", e.target.value)}
                  inputMode="numeric"
                  disabled={saving}
                />
              </div>

              <div className="input-group">
                <label>Телефон *</label>
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+7 900 000-00-00"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Банковские реквизиты</h3>

              <div className="input-group">
                <label>БИК *</label>
                <input
                  value={form.bik}
                  onChange={(e) => update("bik", e.target.value)}
                  inputMode="numeric"
                  disabled={saving}
                />
              </div>

              <div className="input-group">
                <label>Название банка *</label>
                <input
                  value={form.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="input-group">
                <label>Расчётный счёт *</label>
                <input
                  value={form.settlementAccount}
                  onChange={(e) =>
                    update("settlementAccount", e.target.value)
                  }
                  inputMode="numeric"
                  disabled={saving}
                />
              </div>

              <div className="input-group">
                <label>Корреспондентский счёт *</label>
                <input
                  value={form.correspondentAccount}
                  onChange={(e) =>
                    update("correspondentAccount", e.target.value)
                  }
                  inputMode="numeric"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Ресторан</h3>

              <div className="input-group">
                <label>Название *</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="input-group">
                <label>Адрес *</label>
                <input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Создание..." : "Запустить 24 часа бесплатно"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (screen === "faq") {
    return (
      <main className="app">
        <header className="topbar">
          <button
            className="back-button"
            onClick={() => setScreen("home")}
          >
            ←
          </button>
          <span className="logo">FESTO</span>
        </header>

        <section className="page">
          <h1>FAQ</h1>
          <div className="faq-list">
            <details>
              <summary>Что такое FESTO?</summary>
              <p>
                FESTO — система управления рестораном с QR-меню,
                заказами и аналитикой.
              </p>
            </details>
            <details>
              <summary>Есть ли пробный период?</summary>
              <p>
                Да. Вы можете протестировать FESTO бесплатно в течение
                24 часов.
              </p>
            </details>
            <details>
              <summary>Сколько стоит FESTO?</summary>
              <p>Базовая модель — 5 000 ₽ за бессрочную лицензию.</p>
            </details>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "demo") {
    return (
      <main className="app">
        <header className="topbar">
          <button
            className="back-button"
            onClick={() => setScreen("home")}
          >
            ←
          </button>
          <span className="logo">FESTO</span>
        </header>

        <section className="page">
          <div className="eyebrow">DEMO RESTAURANT</div>
          <h1>La Piazza</h1>
          <p className="subtitle">
            Посмотрите, как FESTO работает для ресторана.
          </p>

          <div className="demo-menu">
            <div className="menu-category">
              <span>🍕</span>
              <div><strong>Пицца</strong><small>12 блюд</small></div>
            </div>
            <div className="menu-category">
              <span>🍝</span>
              <div><strong>Паста</strong><small>8 блюд</small></div>
            </div>
            <div className="menu-category">
              <span>🥤</span>
              <div><strong>Напитки</strong><small>14 блюд</small></div>
            </div>
            <div className="menu-category">
              <span>🍰</span>
              <div><strong>Десерты</strong><small>7 блюд</small></div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <span className="logo">FESTO</span>
        <div className="avatar">
          {firstName.charAt(0).toUpperCase()}
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">RESTAURANT OS</div>
        <h1>
          Добро пожаловать,
          <br />
          {firstName} 👋
        </h1>
        <p>Управляйте рестораном проще — прямо из Telegram.</p>
      </section>

      <section className="trial-card">
        <div className="trial-icon">🎁</div>
        <div className="trial-content">
          <div className="trial-label">БЕСПЛАТНЫЙ ДОСТУП</div>
          <h2>24 часа FESTO</h2>
          <p>Заполните данные ресторана и начните работу.</p>
          <button
            className="primary-button"
            onClick={() => {
              setError("");
              setScreen("trial");
            }}
          >
            Начать trial
          </button>
        </div>
      </section>

      <section className="features">
        <button
          className="feature-card"
          onClick={() => setScreen("demo")}
        >
          <span>👀</span>
          <div>
            <strong>Посмотреть демо</strong>
            <small>Увидеть FESTO в работе</small>
          </div>
          <b>›</b>
        </button>

        <button
          className="feature-card"
          onClick={() => setScreen("faq")}
        >
          <span>❓</span>
          <div>
            <strong>FAQ</strong>
            <small>Ответы на основные вопросы</small>
          </div>
          <b>›</b>
        </button>
      </section>

      <footer>
        <span>FESTO</span>
        <span>Restaurant management</span>
      </footer>
    </main>
  );
}
