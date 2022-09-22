import * as fs from "fs";
export default class usersBot {
  constructor(path) {
    this.path = path;
  }
  async readUsers() {
    const folderPath = this.path.replace("/users.json", "");
    try {
      const data = await fs.promises.readFile(this.path, "utf8");
      return JSON.parse(data);
    } catch (err) {
      if (err.code === "ENOENT") {
        fs.promises.mkdir(folderPath, { recursive: true });
        await fs.promises.writeFile(this.path, []);
      }
      console.log(err.code);
    }
  }
  async writeUser(obj) {
    try {
      let data = await this.readUsers();
      let isDuplicate = false;
      if (!data) data = [];
      data.map(item => {
        if (item.id === obj.id) isDuplicate = true;
      });
      if (!isDuplicate) {
        data.push(obj);
      }
      const json = JSON.stringify(data);
      await fs.promises.writeFile(this.path, json);
    } catch (err) {
      console.log(err);
    }
  }
  async editUsers(user_id, params) {
    let idx = 0;
    try {
      let data = await this.readUsers();
      data.map((item, index) => {
        if (item.id === user_id) idx = index;
      });
      console.log(data[idx]);
      let { active_deal } = params;
      data[idx].active_deal = active_deal;
      await fs.promises.writeFile(this.path, JSON.stringify(data));
    } catch (err) {
      console.log(err);
    }
  }
}
