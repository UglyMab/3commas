import * as fs from "fs";
export default class configBots {
  constructor(path) {
    this.path = path;
  }
  async readConfig() {
    try {
      const data = await fs.promises.readFile(this.path, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.log(err);
    }
  }
  async writeBotConfig(obj) {
    try {
      const { id } = obj;
      let data = await this.readConfig();
      data[id] = obj;
      const json = JSON.stringify(data);
      await fs.promises.writeFile(this.path, json);
    } catch (err) {
      console.log(err);
    }
  }
  async writeSingleConfig(id, index, obj) {
    try {
      const { api_key, api_secret, ...res } = obj;
      let data = await this.readConfig();
      res.type = data[id].bots[index].type;
      data[id].bots[index] = res;
      const json = JSON.stringify(data);
      await fs.promises.writeFile(this.path, json);
    } catch (err) {
      console.log(err);
    }
  }
  async editConfig(id, params) {
    try {
      let data = await this.readConfig();
      data = data[id];
      let {
        name = data.name,
        active = data.active,
        short = data.short,
        long = data.long,
        bots = data.bots,
        key = data.key,
        secret = data.secret,
      } = params;
      this.writeBotConfig({
        id,
        name,
        active,
        short,
        long,
        bots,
        key,
        secret,
      });
    } catch (err) {
      console.log(err);
    }
  }
}