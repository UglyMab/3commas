import threeCommasAPI from "3commas-api-node";
const dateFormat = date => {
  return Math.round(date.getTime() / 1000);
};
export default class threeCommas {
  constructor(api_key, api_secret) {
    this.api = new threeCommasAPI({
      apiKey: api_key,
      apiSecret: api_secret,
    });
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async stopDeal(deal_id) {
    if (!deal_id) return;

    const res = await this.api.dealPanicSell(deal_id);
    console.log(res);
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async checkDeals(time) {
    const deals = await this.api.getDeals({ limit: 5 });
    console.log(deals);
    let res = { status: false };
    deals.forEach(element => {
      const deal_time = dateFormat(new Date(element.created_at));
      if (deal_time > time) {
        res = {
          error: element.deal_has_error,
          message: element.error_message,
        };
      }
    });
    return res;
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async statsBot(long, short) {
    try {
      const l = await this.botDealsStats(long);
      const s = await this.botDealsStats(short);
      return {
        long: Math.round(l.completed_deals_usd_profit * 100) / 100,
        short: Math.round(s.completed_deals_usd_profit * 100) / 100,
      };
    } catch (error) {
      console.log(error);
    }
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async statusBot(bot_id) {
    try {
      const res = await this.api.botShow(bot_id);
      return { enable: res.is_enabled, deal: res.active_deals };
    } catch (error) {
      console.log(error);
    }
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async stopBot(bot_id) {
    try {
      const bots = await this.api.botShow(bot_id);
      let dealId = null;
      if (bots.active_deals.length > 0) {
        dealId = bots.active_deals[0].id;
      }

      await this.stopDeal(dealId);
      await this.api.botDisable(bot_id);
    } catch (error) {
      console.log(error);
    }
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async startBot(bot_id, date) {
    try {
      const response = await this.api.botEnable(bot_id);
      if (response.error) {
        return { status: false, error: response.error };
      }
      if (response.active_deals && response.active_deals.length > 0) {
        return { status: true, error: false }; // bot.sendMessage(chatId, "Deal started successfully ✅");
      } else {
        const result = await this.checkDealsTimeout(date);
        if (result.error) {
          return { status: false, error: result.message };
        } else {
          return { status: true, error: false };
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  checkDealsTimeout(date) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const x = await this.checkDeals(date);
        resolve(x);
      }, 60000);
    });
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async botDealsStats(bot_id) {
    return await this.api.makeRequest(
      "GET",
      `/public/api/ver1/bots/${bot_id}/deals_stats?`,
      {
        bot_id,
      }
    );
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async getBotOptions(bot_id, api_key, api_secret) {
    const obj = await this.api.botShow(bot_id);
    return { api_key, api_secret, ...obj };
  }
  async changeBotOptions(options) {
    const { api_key, api_secret, ...obj } = options;

    console.log(await this.api.botUpdate(obj));
  }
  async getBotsId() {
    const bots = await this.api.getBots();

    return bots;
  }
}
