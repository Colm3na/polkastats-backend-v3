/*const { ProvierFactory, TypeProvider } = require("./providerAPI.js");
const { BridgeAPI } = require('./bridgeApi.js');


async function main () {
  const provider = new ProvierFactory('wss://ws-opal.unique.network', TypeProvider.OPAL);
  const api =  await provider.getApi();

  const bridgeAPI = (new BridgeAPI(api)).bridgeAPI;
  
  const collection = await bridgeAPI.getCollection(1);  
  console.log(collection);
}

main();*/

const test = {  
    owner: '5GR75aMsKBmux3L87Tt9aNqut9QpvXduNkHaagtYGkFtiVux',
    mode: { nft: null },
    access: 'Normal',
    decimalPoints: 0,
    name: [],
    description: [],
    tokenPrefix: '0x4f70656e53656154657374',
    mintMode: false,
    offchainSchema: '0x',
    schemaVersion: 'ImageURL',
    sponsorship: { disabled: null },
    limits: {
      accountTokenOwnershipLimit: 10000000,
      sponsoredDataSize: 2048,
      sponsoredDataRateLimit: null,
      tokenLimit: 4294967295,
      sponsorTransferTimeout: 14400,
      ownerCanTransfer: true,
      ownerCanDestroy: true
    },
    variableOnChainSchema: '0x',
    constOnChainSchema: '0x',
    metaUpdatePermission: 'ItemOwner',
    transfersEnabled: true
};

function capitalizeObject (obj, fn) {
  return Object.keys(obj).reduce((result, key) => {
    result[capitalizeFirstLetter(key)] = fn(obj, key);
    return result;
  }, {});
}

function capitalizeFirstLetter (str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}  

console.log(
  capitalizeObject(test, (test, key) => {    
    return test[key];
  })
)