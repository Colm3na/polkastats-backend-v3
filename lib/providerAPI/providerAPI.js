const { ApiPromise } = require("@polkadot/api");
const { WsProvider } = require("@polkadot/rpc-provider");
const { unique } = require('@unique-nft/types/definitions');
const TypeProvider = require('./type/provider.js');

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

class WestendOpalApi extends ProviderAPI { };

class OpalApi extends ProviderAPI {
  async getApi() {
    return await ApiPromise.create({
      provider: this.provider,
      rpc:  {
        unique: unique.rpc
      }
    })
  }
};

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
      case TypeProvider.WESTEND:
        return new WestendOpalApi(this.url);
      case TypeProvider.OPAL:
      case TypeProvider.QUARTZ:
        return new OpalApi(this.url);
      case TypeProvider.TESTNET2:
        return new Tensnet2Api(this.url);
    }
  }

  async getApi(rtt) {
    const api = await this.provider.getApi(rtt);
    return Object.assign(api, {typeProvider: this.type});
  }
}


module.exports = {  
  ProvierFactory  
};