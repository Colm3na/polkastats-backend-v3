/// <reference types="@unique-nft/types/augment-api-rpc" />
import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { unique } from '@unique-nft/types/definitions';
import { TypeProvider } from './type/provider';

class ProviderAPI {
  protected provider: WsProvider;

  constructor(private url) {
    this.provider = new WsProvider(url);
  }

  async getApi(types?: any): Promise<ApiPromise> {
    return await ApiPromise.create({
      provider: this.provider
    });
  }
}

class WestendOpalApi extends ProviderAPI { };

class OpalApi extends ProviderAPI {
  async getApi(): Promise<ApiPromise> {
    return await ApiPromise.create({
      provider: this.provider,
      rpc: {
        unique: unique.rpc
      }
    });
  }
};

class Testnet2Api extends ProviderAPI {
  getApi(types) {
    return ApiPromise.create({
      provider: this.provider,
      types
    });
  }
}

export class ProviderFactory {
  provider: ProviderAPI;

  constructor(
    private url,
    private type = null,
  ) {
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
        return new Testnet2Api(this.url);
    }
  }

  async getApi(rtt) {
    const api = await this.provider.getApi(rtt);
    return api;
  }
}
