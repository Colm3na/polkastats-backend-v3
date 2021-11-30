const { OpalAPI } = require("./bridgeProviderAPI/concreate/opalAPI.js");
const { QuartzAPI } = require("./bridgeProviderAPI/concreate/quartzAPI.js");
const { TestnetAPI } = require("./bridgeProviderAPI/concreate/testnetAPI.js");
const { ImplementOpalAPI } = require("./bridgeProviderAPI/implement/implementOpalAPI.js");
const { ImplementQuartzAPI } = require("./bridgeProviderAPI/implement/implementQuartzAPI.js");
const { ImplementTestnetAPI } = require("./bridgeProviderAPI/implement/implemnetTestnetAPI.js");
const { TypeProvider } = require("./providerAPI.js");

class BridgeAPI {
    constructor (api) {
      this.api = api;
    }
    
    get bridgeAPI () {
      switch(this.api.typeProvider) {
        case TypeProvider.OPAL:
        case TypeProvider.QUARTZ:
          return new QuartzAPI(
            new ImplementQuartzAPI(this.api)
          )
        case TypeProvider.WESTEND:
          return new OpalAPI(
            new ImplementOpalAPI(this.api)
          );
        case TypeProvider.TESTNET2:
          return new TestnetAPI(
            new ImplementTestnetAPI(this.api)
          )
      }
    }
}

module.exports = { BridgeAPI };