import { useState } from "react";
import "./index.css";

const ADMIN_EMAIL = "yosoycastello@gmail.com";
const ADMIN_PASSWORD = "festo123";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function login(e) {
    e.preventDefault();
    setError("");

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setUser({
        role: "admin",
        name: "Администратор",
        email,
      });
      return;
    }

    if (email === "director@festo.local" && password === "director123") {
      setUser({
        role: "director",
        name: "Директор",
        email,
      });
      return;
    }

    setError("Неверный email или пароль");
  }

  function logout() {
    setUser(null);
    setEmail("");
    setPassword("");
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-glow glow-one" />
        <div className="auth-glow glow-two" />

        <form className="auth-card" onSubmit={login}>
          <div className="logo">F</div>

          <div className="eyebrow">FESTO ORDER</div>

          <h1>Добро пожаловать</h1>

          <p className="auth-description">
            Система управления рестораном
          </p>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите email"
              required
            />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="login-button" type="submit">
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">F</div>
          <span>FESTO</span>
        </div>

        <nav>
          {user.role === "admin" && (
            <>
              <button className="nav-item active">
                Обзор
              </button>

              <button className="nav-item">
                Рестораны
              </button>

              <button className="nav-item">
                Лицензии
              </button>
            </>
          )}

          <button className="nav-item">
            Меню
          </button>

          <button className="nav-item">
            Столики
          </button>

          <button className="nav-item">
            Заказы
          </button>

          <button className="nav-item">
            Настройки
          </button>
        </nav>

        <button className="logout" onClick={logout}>
          Выйти
        </button>
      </aside>

      <main className="main">

        <header className="topbar">
          <div>
            <div className="eyebrow">FESTO ORDER</div>
            <h2>
              {user.role === "admin"
                ? "Панель администратора"
                : "Панель директора"}
            </h2>
          </div>

          <div className="profile">
            <div className="avatar">
              {user.name.charAt(0)}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role === "admin"
                  ? "Администратор"
                  : "Директор"}
              </span>
            </div>
          </div>
        </header>

        <section className="welcome-card">

          <div>
            <span className="card-label">
              СИСТЕМА ГОТОВА
            </span>

            <h1>
              Добро пожаловать в Festo
            </h1>

            <p>
              {user.role === "admin"
                ? "Здесь вы сможете управлять ресторанами, лицензиями, меню и всей системой."
                : "Здесь вы сможете управлять своим рестораном, меню, столиками и заказами."}
            </p>
          </div>

          <div className="welcome-mark">
            F
          </div>

        </section>

        <section className="dashboard-grid">

          <div className="dashboard-card">
            <span>РЕСТОРАНЫ</span>
            <strong>
              {user.role === "admin" ? "0" : "1"}
            </strong>
            <p>Подключено</p>
          </div>

          <div className="dashboard-card">
            <span>МЕНЮ</span>
            <strong>0</strong>
            <p>Блюд</p>
          </div>

          <div className="dashboard-card">
            <span>ЗАКАЗЫ</span>
            <strong>0</strong>
            <p>Сегодня</p>
          </div>

        </section>

      </main>

      <div className="mobile-bar">

        <button className="mobile-active">
          Меню
        </button>

        <button>
          Мой заказ
        </button>

      </div>

    </div>
  );
}

export default App;