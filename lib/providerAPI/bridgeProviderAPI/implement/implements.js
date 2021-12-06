const { ImplementOpalAPI } = require('./implementOpalAPI.js');
const { ImplementTestnetAPI } = require('./implemnetTestnetAPI.js');

module.exports = Object.freeze({
  opalAPI: ImplementOpalAPI,
  testnetAPI: ImplementTestnetAPI
});