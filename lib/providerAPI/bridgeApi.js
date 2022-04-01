const { OpalAPI } = require("./bridgeProviderAPI/concreate/opalAPI.js");
const { TestnetAPI } = require("./bridgeProviderAPI/concreate/testnetAPI.js");
const Implements = require('./bridgeProviderAPI/implement/implements.js');

const TypeProvider = require('./type/provider.js');

class BridgeAPI {
    constructor (api) {
      this.api = api;
    }

    get bridgeAPI () {
      switch(this.api.typeProvider) {
        case TypeProvider.OPAL:
        case TypeProvider.QUARTZ:
        case TypeProvider.WESTEND:
          return new OpalAPI(
            new Implements.opalAPI(this.api)
          );
        case TypeProvider.TESTNET2:
          return new TestnetAPI(
            new Implements.testnetAPI(this.api)
          )
      }
    }
}

module.exports = { BridgeAPI };