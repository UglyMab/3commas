import threeCommasAPI from "3commas-api-node";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import TelegramBot from "node-telegram-bot-api";
dotenv.config();

const api = new threeCommasAPI({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
});
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const keyboard = [
  [
    {
      text: "Start all bots",
      callback_data: "start",
    },
  ],
  [
    {
      text: "Stop all bots",
      callback_data: "stop",
    },
  ],
  [
    {
      text: "Show stats",
      callback_data: "stats",
    },
  ],
  [
    {
      text: "Status",
      callback_data: "status",
    },
  ],
];
bot.on("message", msg => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Select a command from the list:", {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});
const botDealsStats = async bot_id => {
  return await api.makeRequest(
    "GET",
    `/public/api/ver1/bots/${bot_id}/deals_stats?`,
    { bot_id }
  );
};

bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;

  let img = "";

  if (query.data === "status") {
    const text = await api.botShow(9680142);
    console.log(text.is_enabled);
    bot.sendMessage(
      chatId,
      text.is_enabled ? "Bot launched ✅" : "Bot is not running ❌"
    );
  }

  if (query.data === "stats") {
    const text = await botDealsStats(9680142);

    bot.sendMessage(
      chatId,
      "Total profit: " +
        Math.round(text.completed_deals_usd_profit * 100) / 100 +
        " USD"
    );
  }

  if (query.data === "start") {
    let text = await api.botEnable(9680142);
    const today = Math.round(new Date().getTime() / 1000);
    bot.sendMessage(chatId, "Bot launched successfully! ✅\nDeal in progress ⌛");
    setTimeout(async () => {
      text = await api.getDeals({ limit: 5 });
      text.forEach(element => {
        const deal_time = Math.round(
          new Date(element.created_at).getTime() / 1000
        );
        if (deal_time > today) {
          bot.sendMessage(
            chatId,
            element.deal_has_error
              ? "Deal has error ❌: \n" +
                element.error_message +
                "\nBot stopped ❌"
              : "Deal started successfully ✅"
          );
        }
      });
    }, 60000);
  }
  if (query.data === "stop") {
    const text = await api.botDisable(9680142);
    bot.sendMessage(chatId, "Bot stopped ❌");
  }
});
