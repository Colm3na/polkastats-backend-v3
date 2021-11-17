const { OpalAPI } = require("./bridgeProviderAPI/opalAPI.js");
const { TypeProvider } = require("./providerAPI.js");
const { ConcreteOpalAPI } = require('./bridgeProviderAPI/concrete/opalAPI.js');
const { TestnetAPI } = require("./bridgeProviderAPI/testnetAPI");
const { ConcreteTestnetAPI } = require("./bridgeProviderAPI/concrete/testnetAPI");

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
            new ConcreteOpalAPI(this.api)
          );
        case TypeProvider.TESTNET2:
          return new TestnetAPI(
            new ConcreteTestnetAPI(this.api)
          )
      }
    }
}

module.exports = { BridgeAPI };