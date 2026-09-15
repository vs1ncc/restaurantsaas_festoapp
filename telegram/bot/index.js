import { Telegraf, Markup } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

if (!MINI_APP_URL) {
  throw new Error("MINI_APP_URL is not set");
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const user = ctx.from;

  await ctx.reply(
    `🔥 FESTO\n\n` +
      `Добро пожаловать, ${user.first_name || "друг"}!\n\n` +
      `Управляйте рестораном проще.\n\n` +
      `✓ QR-меню\n` +
      `✓ Заказы\n` +
      `✓ Управление меню\n` +
      `✓ Статистика\n\n` +
      `🎁 Попробуйте FESTO бесплатно в течение 24 часов.`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp("🚀 Открыть FESTO", MINI_APP_URL)
      ],
      [
        Markup.button.url("👀 Посмотреть демо", MINI_APP_URL)
      ],
      [
        Markup.button.callback("❓ FAQ", "faq")
      ]
    ])
  );
});

bot.action("faq", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `❓ FAQ FESTO\n\n` +
      `Что такое FESTO?\n` +
      `FESTO — система управления рестораном с QR-меню, заказами и аналитикой.\n\n` +
      `🎁 Есть ли пробный период?\n` +
      `Да. На первом этапе мы предусматриваем 24 часа бесплатного доступа.\n\n` +
      `💳 Сколько стоит FESTO?\n` +
      `Базовая модель — 5 000 ₽ за бессрочную лицензию.`
  );
});

bot.catch((error) => {
  console.error("Telegram bot error:", error);
});

bot.launch();

console.log("🔥 FESTO Telegram bot started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
