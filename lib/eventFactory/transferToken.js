const tokenDB = require("../tokenDB.js");
const { EventToken } = require("./eventToken.js");


class TransferToken extends EventToken {
  async save() {
    if (this.data.collectionId && this.data.tokenId) {
      const token = await this.getToken();
      await tokenDB.save(token, this.sequelize);
    }
  }
}

module.exports = { TransferToken };