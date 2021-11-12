const { ConcreteTestnetAPI } = require("./bridgeProviderAPI/concrete/testnetAPI");
const { ProvierFactory, TypeProvider } = require("./providerAPI.js");
const { TestnetAPI } = require('./bridgeProviderAPI/testnetAPI.js');
const rtt = require('../../config/runtime_types.json');



async function main () {
  const provider = new ProvierFactory('wss://ws-opal.unique.network', TypeProvider.OPAL);
  const api =  await provider.getApi(rtt);

  const testnetApi = new TestnetAPI(
    new ConcreteTestnetAPI(api)
  );

  const collection = await testnetApi.getCollection(100);  
  console.log(collection);
}

main();