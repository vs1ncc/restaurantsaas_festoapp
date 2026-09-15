import { useState } from "react";

export default function App({ telegram }) {
  const [screen, setScreen] = useState("home");

  const user = telegram?.initDataUnsafe?.user;

  const firstName = user?.first_name || "гость";

  if (screen === "faq") {
    return (
      <main className="app">
        <header className="topbar">
          <button className="back-button" onClick={() => setScreen("home")}>
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
              <p>
                Базовая модель — 5 000 ₽ за бессрочную лицензию.
              </p>
            </details>

            <details>
              <summary>Нужна ли специальная техника?</summary>
              <p>
                Нет. FESTO рассчитан на работу с обычными устройствами
                и современным браузером.
              </p>
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
          <button className="back-button" onClick={() => setScreen("home")}>
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
              <div>
                <strong>Пицца</strong>
                <small>12 блюд</small>
              </div>
            </div>

            <div className="menu-category">
              <span>🍝</span>
              <div>
                <strong>Паста</strong>
                <small>8 блюд</small>
              </div>
            </div>

            <div className="menu-category">
              <span>🥤</span>
              <div>
                <strong>Напитки</strong>
                <small>14 блюд</small>
              </div>
            </div>

            <div className="menu-category">
              <span>🍰</span>
              <div>
                <strong>Десерты</strong>
                <small>7 блюд</small>
              </div>
            </div>
          </div>

          <button className="primary-button" onClick={() => setScreen("home")}>
            Вернуться в FESTO
          </button>
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

        <p>
          Управляйте рестораном проще —
          прямо из Telegram.
        </p>
      </section>

      <section className="trial-card">
        <div className="trial-icon">🎁</div>

        <div className="trial-content">
          <div className="trial-label">БЕСПЛАТНЫЙ ДОСТУП</div>

          <h2>24 часа FESTO</h2>

          <p>
            Попробуйте основные возможности
            без обязательств.
          </p>

          <button className="primary-button">
            Начать trial
          </button>
        </div>
      </section>

      <section className="features">
        <button className="feature-card" onClick={() => setScreen("demo")}>
          <span>👀</span>
          <div>
            <strong>Посмотреть демо</strong>
            <small>Увидеть FESTO в работе</small>
          </div>
          <b>›</b>
        </button>

        <button className="feature-card" onClick={() => setScreen("faq")}>
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
