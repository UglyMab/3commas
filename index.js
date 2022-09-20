import * as dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import threeCommas from "./tc.js";
import configBots from "./utils/config.js";
import Encrypter from "./utils/crypto.js";
dotenv.config();

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
  [
    {
      text: "Change strategy",
      callback_data: "strategy",
    },
  ],
  [
    {
      text: "Add bot",
      callback_data: "reply",
    },
  ],
  [
    {
      text: "Menu",
      callback_data: "menu",
    },
  ],
  [
    {
      text: "TEST",
      callback_data: "test",
    },
  ],
];
const keyboard4 = [["Edit bot ✏️", "Toggle strategy 🔄"], ["Back ◀"]];
const keyboard3 = [
  ["Start 🚀", "Stop ⛔"],
  ["Status ✅", "Statistics 📈"],
  ["Settings ⚙"],
];
const keyboard2 = [
  [
    {
      text: "Edit name ✏",
    },
    {
      text: "Toggle strategy 🔄",
    },
  ],
  [
    {
      text: "Remove ❌",
    },
  ],
  [
    {
      text: "Back ◀",
    },
  ],
];
const keyboard5 = [
  [
    { text: "Bot long name", callback_data: "edit:0" },
    { text: "bot 2", callback_data: "edit:1" },
  ],
  [
    { text: "17", callback_data: "edit:2" },
    { text: "New bot long type !!!!", callback_data: "edit:3" },
  ],
];
let newBot = {};
let botEdit = {};
function generateKeyboard(data) {
  const keyboard = [];
  data.forEach((element, index) => {
    const res = {};
    res.text = element.name;
    res.callback_data = "edit:" + element.id;
    if (index % 2) {
      keyboard[keyboard.length - 1].push(res);
    } else {
      keyboard.push([res]);
    }
  });
  return keyboard;
}
function generateEditKeyboard(data, id) {
  console.log(id);
  const keyboard = [
    [
      {
        text: "Edit long bot",
        callback_data: `edit_long: ${data.bots[0].type === "long"
          ? "0|" + id
          : "1|" + id}`,
      },
      {
        text: "Edit short bot",
        callback_data: `edit_short:${data.bots[1].type === "short"
          ? "1|" + id
          : "0|" + id}`,
      },
    ],
  ];
  console.log(data.bots[0]);
  console.log(keyboard);
  return keyboard;
}
bot.on("message", async msg => {
  const config = new configBots("config.json");
  const encrypt = new Encrypter(process.env.SECRET_KEY);
  const loadData = await config.readConfig();
  const chatId = msg.chat.id; // console.log(generateKeyboard(loadData));
  if (msg.reply_to_message) {
    if (msg.reply_to_message.text === "Enter take profit value") {
      const bot_id = loadData[botEdit.id].bots[botEdit.bot_id].bot_id;
      const api_key = encrypt.dencrypt(loadData[botEdit.id].key);
      const api_secret = encrypt.dencrypt(loadData[botEdit.id].secret);
      const tc = new threeCommas(api_key, api_secret);
      const stat = await tc.getBotOptions(bot_id, api_key, api_secret);
      const obj = {
        name: stat.name,
        pairs: JSON.stringify(stat.pairs),
        base_order_volume: stat.base_order_volume,
        take_profit: +msg.text,
        safety_order_volume: stat.safety_order_volume,
        martingale_volume_coefficient: stat.martingale_volume_coefficient,
        martingale_step_coefficient: stat.martingale_step_coefficient,
        max_safety_orders: stat.max_safety_orders,
        active_safety_orders_count: stat.active_safety_orders_count,
        safety_order_step_percentage: stat.safety_order_step_percentage,
        take_profit_type: stat.take_profit_type,
        stop_loss_percentage: stat.stop_loss_percentage,
        strategy_list: JSON.stringify(stat.strategy_list),
        bot_id: stat.id,
        api_key: api_key,
        api_secret: api_secret,
      };
      await tc.changeBotOptions(obj);
      await config.writeSingleConfig(botEdit.id, botEdit.bot_id, obj);
      botEdit = {};
    }
    if (msg.reply_to_message.text === "Enter stop loss value") {
      const bot_id = loadData[botEdit.id].bots[botEdit.bot_id].bot_id;
      const api_key = encrypt.dencrypt(loadData[botEdit.id].key);
      const api_secret = encrypt.dencrypt(loadData[botEdit.id].secret);
      const tc = new threeCommas(api_key, api_secret);
      const stat = await tc.getBotOptions(bot_id, api_key, api_secret);
      const obj = {
        name: stat.name,
        pairs: JSON.stringify(stat.pairs),
        base_order_volume: stat.base_order_volume,
        take_profit: stat.take_profit,
        safety_order_volume: stat.safety_order_volume,
        martingale_volume_coefficient: stat.martingale_volume_coefficient,
        martingale_step_coefficient: stat.martingale_step_coefficient,
        max_safety_orders: stat.max_safety_orders,
        active_safety_orders_count: stat.active_safety_orders_count,
        safety_order_step_percentage: stat.safety_order_step_percentage,
        take_profit_type: stat.take_profit_type,
        strategy_list: JSON.stringify(stat.strategy_list),
        stop_loss_percentage: +msg.text,
        bot_id: stat.id,
        api_key: api_key,
        api_secret: api_secret,
      };
      await tc.changeBotOptions(obj);
      await config.writeSingleConfig(botEdit.id, botEdit.bot_id, obj);
      botEdit = {};
    }
    if (
      msg.reply_to_message.text === "Please forward the API_KEY to this message"
    ) {
      bot.sendMessage(chatId, "Please forward the API_SECRET to this message", {
        reply_markup: { force_reply: true },
      });
      newBot.key = msg.text;
      return;
    }
    if (
      msg.reply_to_message.text ===
      "Please forward the API_SECRET to this message"
    ) {
      bot.sendMessage(chatId, "Please forward the Bot name to this message", {
        reply_markup: { force_reply: true },
      });
      newBot.secret = msg.text;
      return;
    }
    if (
      msg.reply_to_message.text ===
      "Please forward the Bot name to this message"
    ) {
      newBot.name = msg.text;
      const loadData = await config.readConfig();
      const tc = new threeCommas(newBot.key, newBot.secret);
      const ids = await tc.getBotsId();
      const bots = [];
      const obj = {};
      ids.map(item => {
        if (item.strategy === "long") obj.long = item.id;
        if (item.strategy === "short") obj.short = item.id;
        bots.push({
          name: item.name,
          pairs: JSON.stringify(item.pairs),
          base_order_volume: item.base_order_volume,
          take_profit: item.take_profit,
          safety_order_volume: item.safety_order_volume,
          martingale_volume_coefficient: item.martingale_volume_coefficient,
          martingale_step_coefficient: item.martingale_step_coefficient,
          max_safety_orders: item.max_safety_orders,
          active_safety_orders_count: item.active_safety_orders_count,
          safety_order_step_percentage: item.safety_order_step_percentage,
          take_profit_type: item.take_profit_type,
          strategy_list: JSON.stringify(item.strategy_list),
          stop_loss_percentage: item.stop_loss_percentage,
          bot_id: item.id,
          type: item.strategy,
        });
      });
      config.writeBotConfig({
        id: loadData.length,
        name: newBot.name,
        active: "long",
        short: obj.short,
        long: obj.long,
        bots,
        key: encrypt.encrypt(newBot.key),
        secret: encrypt.encrypt(newBot.secret),
      });
      bot.sendMessage(chatId, newBot.name + " succesfully added! ✅");
      newBot = {};
    }
  }
  if (msg.text === "Start 🚀") {
    const date = msg.date;
    bot.sendMessage(chatId, "Bot launched successfully! ✅\nDeal in progress ⌛");
    loadData.forEach(async element => {
      const type = element.active;
      const bot_id = element[type];
      const api_key = encrypt.dencrypt(element.key);
      const api_secret = encrypt.dencrypt(element.secret);
      const tc = new threeCommas(api_key, api_secret);
      const res = await tc.startBot(bot_id, api_key, api_secret, date);
      if (res.status) {
        bot.sendMessage(chatId, "Deal started successfully ✅");
      } else {
        bot.sendMessage(chatId, res.error + "\nBot stopped ❌");
      }
    });
    return;
  }
  if (msg.text === "Stop ⛔") {
    loadData.forEach(async element => {
      const type = element.active;
      const bot_id = element[type];
      const bot_name = element.name;
      const api_key = encrypt.dencrypt(element.key);
      const api_secret = encrypt.dencrypt(element.secret);
      const tc = new threeCommas(api_key, api_secret);
      await tc.stopBot(bot_id, api_key, api_secret);
      bot.sendMessage(chatId, bot_name + " stopped ❌ | " + type);
    });
    return;
  }
  if (msg.text === "Status ✅") {
    loadData.forEach(async element => {
      const type = element.active;
      const bot_id = element[type];
      const bot_name = element.name;
      const api_key = encrypt.dencrypt(element.key);
      const api_secret = encrypt.dencrypt(element.secret);
      const tc = new threeCommas(api_key, api_secret);
      const res = await tc.statusBot(bot_id, api_key, api_secret);
      bot.sendMessage(
        chatId,
        res
          ? bot_name + " launched ✅ | " + type
          : bot_name + "Bot is not running ❌ | " + type
      );
    });
    return;
  }
  if (msg.text === "Statistics 📈") {
    const obj = {};
    loadData.forEach(async element => {
      const type = element.active;
      const api_key = encrypt.dencrypt(element.key);
      const api_secret = encrypt.dencrypt(element.secret);
      const tc = new threeCommas(api_key, api_secret);
      const stat = await tc.statsBot(
        element.long,
        element.short,
        api_key,
        api_secret
      );
      bot.sendMessage(
        chatId,
        element.name +
          "\nTotal profit: " +
          (stat.long + stat.short) +
          " USD \n" +
          "Long profit: " +
          stat.long +
          " USD \n" +
          "Short profit: " +
          stat.short +
          " USD \n"
      );
    });
    return;
  }
  if (msg.text === "Settings ⚙") {
    bot.sendMessage(chatId, "SETTINGS!", {
      reply_markup: { keyboard: keyboard4, resize_keyboard: true },
      resize_keyboard: true,
    });
    return;
  }
  if (msg.text === "Edit bot ✏️") {
    bot.sendMessage(chatId, "EDIT!", {
      reply_markup: { inline_keyboard: generateKeyboard(loadData) },
    });
    return;
  }
  if (msg.text === "Toggle strategy 🔄") {
    loadData.map((element, id) => {
      let type = element.active;
      type === "short" ? (type = "long") : (type = "short");
      setTimeout(() => {
        config.editConfig(id, { active: type });
      }, 200 * id);
      bot.sendMessage(
        chatId,
        type === "short"
          ? "You choosed short strategy | " + element.name
          : "You choosed long strategy | " + element.name
      );
    });
    return;
  } //   bot.sendMessage(chatId, "Please forward the API_KEY to this message", { //     reply_markup: { force_reply: true }, //   }); //   return; // } // if (msg.text === "Add bot ✚") {
  if (msg.text === "Back ◀") {
    bot.sendMessage(chatId, "MENU!", {
      reply_markup: { keyboard: keyboard3, resize_keyboard: true },
      resize_keyboard: true,
    });
    return;
  }
  bot.sendMessage(chatId, "Menu", {
    reply_markup: {
      keyboard: keyboard3,
    },
  });
});
bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;
  const config = new configBots("config.json");
  const encrypt = new Encrypter(process.env.SECRET_KEY);
  const loadData = await config.readConfig();
  if (query.data === "menu") {
    bot.sendMessage(chatId, "MENU!", {
      reply_markup: { keyboard: keyboard3, resize_keyboard: true },
      resize_keyboard: true,
    });
  }
  if (query.data.includes("edit:")) {
    const id = query.data.split(":")[1];
    bot.sendMessage(chatId, "Choose a bot type:", {
      reply_markup: {
        inline_keyboard: generateEditKeyboard(loadData[id], id),
      },
    });
  }
  if (query.data.includes("edit_long:") || query.data.includes("edit_short:")) {
    const id = query.data.split(":")[1];
    console.log(id);
    const keyboard = [
      [
        { text: "Edit take profit", callback_data: "edit_take:" + id },
        { text: "Edit stop loss", callback_data: "edit_loss:" + id },
      ],
    ];
    bot.sendMessage(chatId, "Select parameter", {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }
  if (query.data.includes("edit_take:")) {
    const ids = query.data.split(":")[1].trim();
    const [id, bot_id] = ids.split("|");
    botEdit = { id, bot_id };
    console.log(botEdit);
    bot.sendMessage(chatId, "Enter take profit value", {
      reply_markup: { force_reply: true },
    });
  }
  if (query.data.includes("edit_loss:")) {
    const ids = query.data.split(":")[1].trim();
    const [id, bot_id] = ids.split("|");
    botEdit = { id, bot_id };
    console.log(botEdit);
    bot.sendMessage(chatId, "Enter stop loss value", {
      reply_markup: { force_reply: true },
    });
  }
  if (query.data.includes("test")) {
    await Promise.all(
      loadData.map(async element => {
        const type = element.active;
        const bot_id = element[type];
        const api_key = encrypt.dencrypt(element.key);
        const api_secret = encrypt.dencrypt(element.secret);
        const tc = new threeCommas(api_key, api_secret);
        const stat = await tc.getBotOptions(bot_id, api_key, api_secret);
        const obj = {
          name: stat.name,
          pairs: JSON.stringify(stat.pairs),
          base_order_volume: stat.base_order_volume,
          take_profit: stat.take_profit,
          safety_order_volume: stat.safety_order_volume,
          martingale_volume_coefficient: stat.martingale_volume_coefficient,
          martingale_step_coefficient: stat.martingale_step_coefficient,
          max_safety_orders: stat.max_safety_orders,
          active_safety_orders_count: stat.active_safety_orders_count,
          safety_order_step_percentage: stat.safety_order_step_percentage,
          take_profit_type: stat.take_profit_type,
          strategy_list: JSON.stringify(stat.strategy_list),
          bot_id: stat.id,
          api_key: api_key,
          api_secret: api_secret,
        };
        console.log(obj);
      })
    ); // await tc.changeBotOptions(obj);
  }
});
