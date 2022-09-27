import * as dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import threeCommas from "./tc.js";
import configBots from "./utils/config.js";
import Encrypter from "./utils/crypto.js";
import usersBot from "./utils/users.js";
dotenv.config();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const users = new usersBot("users/users.json");
let usersData = await users.readUsers();
console.log(usersData);

async function checkDeals(users) {
  const encrypt = new Encrypter(process.env.SECRET_KEY);
  const data = await users.readUsers();
  let message = "";
  let id = null;
  await Promise.all(
    data.map(async (item) => {
      const config = new configBots("config/" + item.id + "/config.json");
      const loadData = await config.readConfig();
      const active_deals = item.active_deal;
      if (loadData[0] !== undefined) {
        loadData.map(async (el, idx) => {
          const api_key = encrypt.dencrypt(el.key);
          const api_secret = encrypt.dencrypt(el.secret);
          const tc = new threeCommas(api_key, api_secret);

          const deals = await tc.checkDeals();
          if (!deals) {
          }
          checkActiveDeal(deals, item, idx,active_deals);
        });
      }
    })
  );
  console.log(message, id);
  if (message) {
  }
}
function checkActiveDeal(deals,item,idx,active_deals) {
  if (!deals) {
    return
  }
  deals.map(async (element) => {
    if (element.id === item.active_deal[idx]) {
      if (
        element.status === "completed" ||
        element.status === "stop_loss_finished" ||
        element.status === "panic_sold"
      ) {
       let id = item.id;
       let message =
          "Deal cancel. " +
          element.localized_status +
          "\nProfit: " +
          element.usd_final_profit +
          " USD";
        bot.sendMessage(id, message);
        active_deals[idx] = null;
        await users.editUsers(id, { active_deal: active_deals });
      }
    }
  });
}
setInterval(() => {
  checkDeals(users);
}, 10000);

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
const keyboard4 = [
  ["Edit bot ✏️", "Toggle strategy 🔄"],
  ["Add bot ✚"],
  ["Back ◀"],
];
const keyboard3 = [
  ["Start 🚀", "Stop ⛔"],
  ["Status ✅", "Statistics 📈"],
  ["Settings ⚙"],
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
  console.log(keyboard);
  return keyboard;
}
function generateEditKeyboard(data, id) {
  console.log(id);
  const keyboard = [
    [
      {
        text: "Edit long bot",
        callback_data: `edit_long: ${
          data.bots[0].type === "long" ? id + "|0" : id + "|1"
        }`,
      },
      {
        text: "Edit short bot",
        callback_data: `edit_short:${
          data.bots[1].type === "short" ? id + "|1" : id + "|0"
        }`,
      },
    ],
  ];
  console.log(data.bots[0]);
  console.log(keyboard);
  return keyboard;
}
bot.on("message", async (msg) => {
  const encrypt = new Encrypter(process.env.SECRET_KEY);
  const chatId = msg.chat.id; // console.log(generateKeyboard(loadData));
  const config = new configBots("config/" + chatId + "/config.json");
  const loadData = await config.readConfig();
  if (msg.text === "/start") {
    users.writeUser({
      id: msg.chat.id,
      username: msg.chat.username,
      active_deal: [null],
    });
    return;
  }
  if (!loadData && !msg.reply_to_message) {
    bot.sendMessage(chatId, "You don't have bots, do you want to add?", {
      reply_markup: {
        inline_keyboard: [[{ text: "Yes", callback_data: "add_bot" }]],
      },
    });
    return;
  }
  if (msg.reply_to_message) {
    if (msg.reply_to_message.text === "Enter base order value") {
      const bot_id = loadData[botEdit.id].bots[botEdit.bot_id].bot_id;
      const api_key = encrypt.dencrypt(loadData[botEdit.id].key);
      const api_secret = encrypt.dencrypt(loadData[botEdit.id].secret);
      const tc = new threeCommas(api_key, api_secret);
      const stat = await tc.getBotOptions(bot_id, api_key, api_secret);
      const obj = {
        name: stat.name,
        pairs: JSON.stringify(stat.pairs),
        base_order_volume: +msg.text,
        take_profit: stat.take_profit,
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
      msg.reply_to_message.text ===
      "Please forward the bot name to this message"
    ) {
      bot.sendMessage(chatId, "Please forward the API_KEY to this message", {
        reply_markup: { force_reply: true },
      });
      newBot.name = msg.text;
      return;
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
      newBot.secret = msg.text;
      console.log(newBot);
      let loadData = await config.readConfig();
      if (!loadData) {
        loadData = [];
      }
      const tc = new threeCommas(newBot.key, newBot.secret);
      const ids = await tc.getBotsId();
      if (ids.error) {
        bot.sendMessage(chatId, "Invalid api key or secret key ❌");
        return;
      }
      const bots = [];
      const obj = {};
      ids.map((item) => {
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
  if (loadData.length === 0 && msg.text !== "Settings ⚙" && msg.text !== 'Add bot ✚') {
    bot.sendMessage(chatId, "You don't have bots, do you want to add?", {
      reply_markup: {
        inline_keyboard: [[{ text: "Yes", callback_data: "add_bot" }]],
      },
    });
    return;
  }
  if (msg.text === "Start 🚀") {
    const date = msg.date;
    bot.sendMessage(chatId, "Please, wait ⌛");
    let isEnabled = false;
    let message = "";
    const data = await users.readUsers();
    let active_deals = [];
    data.map((el) => {
      if (el.id === chatId) {
        active_deals = el.active_deal;
      }
    });
    await Promise.all(
      loadData.map(async (element, idx) => {
        const type = element.active;
        const bot_id = element[type];
        const bot_name = element.name;
        const api_key = encrypt.dencrypt(element.key);
        const api_secret = encrypt.dencrypt(element.secret);
        const tc = new threeCommas(api_key, api_secret);
        const status = await tc.statusBot(bot_id, api_key, api_secret);
        if (status.enable && status.deal.length) {
          if (!isEnabled) {
            bot.sendMessage(
              chatId,
              "There are running bots with open deals, close open deals?",
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: "Yes", callback_data: "start_all" },
                      { text: "Check bots", callback_data: "check" },
                    ],
                  ],
                },
              }
            );
            isEnabled = true;
          }
        } else {
          await tc.stopBot(bot_id, api_key, api_secret);
          const res = await tc.startBot(bot_id, date);
          console.log(res);
          if (res.status) {
            message +=
              bot_name +
              " successfully started a deal ✅\nBase order price: " +
              res.price +
              " USD\n-----\n";
            active_deals[idx] = res.id;
            users.editUsers(chatId, { active_deal: active_deals });
          } else {
            if (res.error === "free_plan_limit_reached") {
              message = "Too many requests, please try again in 2 minutes";
            } else {
              message +=
                bot_name + " \n" + res.error + "\nBot stopped ❌\n-----\n";
            }
          }
        }
      })
    );
    if (message.length) {
      bot.sendMessage(chatId, message);
    }
    return;
  }
  if (msg.text === "Stop ⛔") {
    await Promise.all(
      loadData.map(async (element) => {
        const type = element.active;
        const bot_id = element[type];
        const api_key = encrypt.dencrypt(element.key);
        const api_secret = encrypt.dencrypt(element.secret);
        const tc = new threeCommas(api_key, api_secret);
        await tc.stopBot(bot_id);
      })
    );
    bot.sendMessage(chatId, "All bots have been stopped ❌");
    return;
  }
  if (msg.text === "Status ✅") {
    let message = "";
    await Promise.all(
      loadData.map(async (element) => {
        const type = element.active;
        const bot_id = element[type];
        const bot_name = element.name;
        const api_key = encrypt.dencrypt(element.key);
        const api_secret = encrypt.dencrypt(element.secret);
        const tc = new threeCommas(api_key, api_secret);
        const res = await tc.statusBot(bot_id);
        const msg = `${
          res.enable
            ? bot_name + " launched ✅ | " + type
            : bot_name + " is not running ❌ | " + type
        } \nActive deal: ${
          res.deal.length
            ? "\nProfit: " + res.deal[0].usd_final_profit + " USD"
            : "none"
        }`;
        message += msg + "\n-----\n";
      })
    );
    bot.sendMessage(chatId, message);
    return;
  }
  if (msg.text === "Statistics 📈") {
    let message = "";
    await Promise.all(
      loadData.map(async (element) => {
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
        message +=
          element.name +
          "\nTotal profit: " +
          Math.round((stat.long + stat.short) * 100) / 100 +
          " USD \n" +
          "Long profit: " +
          stat.long +
          " USD \n" +
          "Short profit: " +
          stat.short +
          " USD \n-----\n";
      })
    );
    bot.sendMessage(chatId, message);
    return;
  }
  if (msg.text === "Settings ⚙") {
    bot.sendMessage(chatId, "Change settings or return to menu:", {
      reply_markup: { keyboard: keyboard4, resize_keyboard: true },
      resize_keyboard: true,
    });
    return;
  }
  if (msg.text === "Edit bot ✏️") {
    bot.sendMessage(chatId, "Select a bot to edit", {
      reply_markup: { inline_keyboard: generateKeyboard(loadData) },
    });
    return;
  }
  if (msg.text === "Toggle strategy 🔄") {
    let newType = "";
    await Promise.all(
      loadData.map((element, id) => {
        let type = element.active;
        type === "short" ? (type = "long") : (type = "short");
        newType = type;
        setTimeout(() => {
          config.editConfig(id, { active: type });
        }, 500 * id);
      })
    );
    bot.sendMessage(
      chatId,
      newType === "short"
        ? "You choosed short strategy"
        : "You choosed long strategy"
    );
    return;
  }
  if (msg.text === "Add bot ✚") {
    bot.sendMessage(chatId, "Please forward the bot name to this message", {
      reply_markup: { force_reply: true },
    });
    return;
  }
  if (msg.text === "Back ◀") {
    bot.sendMessage(chatId, "Choose a command from the menu:", {
      reply_markup: { keyboard: keyboard3, resize_keyboard: true },
      resize_keyboard: true,
    });
    return;
  }
  bot.sendMessage(chatId, "Choose a command from the menu:", {
    reply_markup: {
      keyboard: keyboard3,
      resize_keyboard: true,
    },
  });
});
bot.on("callback_query", async (query) => {
  if (query.data === "start") {
  }
  const chatId = query.message.chat.id;
  const config = new configBots("config/" + chatId + "/config.json");
  const encrypt = new Encrypter(process.env.SECRET_KEY);
  const loadData = await config.readConfig();
  if (loadData.length === 0 && query.data !== "add_bot") {
    bot.sendMessage(chatId, "You don't have bots, do you want to add?", {
      reply_markup: {
        inline_keyboard: [[{ text: "Yes", callback_data: "add_bot" }]],
      },
    });
    return;
  }
  if (query.data === "add_bot") {
    bot.sendMessage(chatId, "Please forward the bot name to this message", {
      reply_markup: { force_reply: true },
    });
  }
  if (query.data === "start_all") {
    const date = query.message.date;
    bot.sendMessage(chatId, "Please, wait ⌛");
    let isEnabled = false;
    const data = await users.readUsers();
    let active_deals = [];
    data.map((el) => {
      if (el.id === chatId) {
        active_deals = el.active_deal;
      }
    });
    let message = "";
    await Promise.all(
      loadData.map(async (element, idx) => {
        const type = element.active;
        const bot_id = element[type];
        const bot_name = element.name;
        const api_key = encrypt.dencrypt(element.key);
        const api_secret = encrypt.dencrypt(element.secret);
        const tc = new threeCommas(api_key, api_secret);
        await tc.stopBot(bot_id, api_key, api_secret);
        const res = await tc.startBot(bot_id, date);
        if (res.status) {
          message +=
            bot_name +
            " successfully started a deal ✅\nBase order price: " +
            res.price +
            " USD\n-----\n";
          active_deals[idx] = res.id;
          users.editUsers(chatId, { active_deal: active_deals });
        } else {
          if (res.error === "free_plan_limit_reached") {
            message = "Too many requests, please try again in 2 minutes";
          } else {
            message +=
              bot_name + " \n" + res.error + "\nBot stopped ❌\n-----\n";
          }
        }
      })
    );
    if (message.length) {
      bot.sendMessage(chatId, message);
    }
  }
  if (query.data === "check") {
    loadData.forEach(async (element) => {
      const type = element.active;
      const bot_id = element[type];
      const bot_name = element.name;
      const api_key = encrypt.dencrypt(element.key);
      const api_secret = encrypt.dencrypt(element.secret);
      const tc = new threeCommas(api_key, api_secret);
      const res = await tc.statusBot(bot_id, api_key, api_secret);
      bot.sendMessage(
        chatId,
        `${
          res.enable
            ? bot_name + " launched ✅ | " + type
            : bot_name + " is not running ❌ | " + type
        } \nActive deal: ${
          res.deal.length
            ? "\nProfit: " + res.deal[0].usd_final_profit + " USD"
            : "none"
        }`
      );
    });
  }
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
    const ids = query.data.split(":")[1].trim();
    const [id, bot_index] = ids.split("|");
    const tp = loadData[id].bots[bot_index].take_profit;
    const slp = loadData[id].bots[bot_index].stop_loss_percentage;
    const bov = loadData[id].bots[bot_index].base_order_volume;
    const keyboard = [
      [
        { text: "Edit take profit | " + tp, callback_data: "edit_take:" + ids },
        { text: "Edit stop loss | " + slp, callback_data: "edit_loss:" + ids },
      ],
      [{ text: "Edit base order | " + bov, callback_data: "edit_base:" + ids }],
    ];
    bot.sendMessage(chatId, "Select parameter", {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }
  if (query.data.includes("edit_base:")) {
    const ids = query.data.split(":")[1].trim();
    const [id, bot_id] = ids.split("|");
    botEdit = { id, bot_id };
    bot.sendMessage(chatId, "Enter base value", {
      reply_markup: { force_reply: true },
    });
  }
  if (query.data.includes("edit_take:")) {
    const ids = query.data.split(":")[1].trim();
    const [id, bot_id] = ids.split("|");
    botEdit = { id, bot_id };
    bot.sendMessage(chatId, "Enter take profit value", {
      reply_markup: { force_reply: true },
    });
  }
  if (query.data.includes("edit_loss:")) {
    const ids = query.data.split(":")[1].trim();
    const [id, bot_id] = ids.split("|");
    botEdit = { id, bot_id };
    bot.sendMessage(chatId, "Enter stop loss value", {
      reply_markup: { force_reply: true },
    });
  }
  if (query.data.includes("test")) {
    await Promise.all(
      loadData.map(async (element) => {
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
    );
    // await tc.changeBotOptions(obj);
  }
});
