const { CreateToken } = require("./token/createToken.js");
const { DestroyedToken } = require("./token/destroyedToken.js");
const { TransferToken } = require("./token/transferToken.js");

module.exports = Object.freeze({
  create: CreateToken,
  destroyed: DestroyedToken,
  transfer: TransferToken
})