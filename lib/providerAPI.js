const { ApiPromise } = require("@polkadot/api");
const { WsProvider } = require("@polkadot/rpc-provider");

const typeProvider = Object.freeze({
  OPAL: 'opal', // wss://ws-opal.unique.network
  WESTEND: 'westend', // wss://westend-opal.unique.network
  QUARTZ: 'quartz', // wss://quartz.unique.network
  TESTNET2: 'testnet2', // wss://testnet2.uniquenetwork.io
});

class ProviderAPI {

  constructor (url) {
    this.url = url;    
    this.provider = new WsProvider(url);
  }

  async getApi() {
    return await ApiPromise.create({
      provider: this.provider
    });
  }
}

class OpalApi extends ProviderAPI { };

class WestendOpalApi extends ProviderAPI { };

class QuartzApi extends ProviderAPI { };

class Tensnet2Api extends ProviderAPI {  
  async getApi(types) {
    return await ApiPromise.create({
      provider: this.provider,
      types
    })
  }
}

class ProvierFactory { 
  constructor(url, type = null) {
    this.url = url;
    this.type = type;    
    this.provider = this.getProvider();
  }

  getProvider() {
    switch (this.type) {
      case typeProvider.OPAL:
        return new OpalApi(this.url);
      case typeProvider.WESTEND:
        return new WestendOpalApi(this.url);
      case typeProvider.QUARTZ:
        return new QuartzApi(this.url);
      case typeProvider.TESTNET2:
        return new Tensnet2Api(this.url);
    }
  }

  async getApi(rtt) {
    return await this.provider.getApi(rtt);
  }
}


module.exports = {  
  ProvierFactory 
};