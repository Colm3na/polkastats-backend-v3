const { ProvierFactory, TypeProvider } = require("./providerAPI.js");
const { BridgeAPI } = require('./bridgeApi.js');


async function main () {
  const provider = new ProvierFactory('wss://ws-opal.unique.network', TypeProvider.OPAL);
  const api =  await provider.getApi();

  const bridgeAPI = (new BridgeAPI(api)).bridgeAPI;
  
  const collection = await bridgeAPI.getCollection(1);        
}

main();