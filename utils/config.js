import * as fs from "fs";
export default class configBots {
  constructor(path) {
    this.path = path;
  }
  async readConfig() {
    const folderPath = this.path.replace("/config.json", "");
    try {
      const data = await fs.promises.readFile(this.path, "utf8");
      return JSON.parse(data);
    } catch (err) {
      if (err.code === "ENOENT") {
        fs.promises.mkdir(folderPath, {
          recursive: true,
        });
        await fs.promises.writeFile(this.path, []);
      }
      console.log(err.code);
    }
  }
  async writeBotConfig(obj) {
    try {
      const { id } = obj;
      let data = await this.readConfig();
      if (!data) data = [];
      console.log(data);
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
