const { ProvierFactory, TypeProvider } = require("./providerAPI.js");
const { BridgeAPI } = require('./bridgeApi.js');


async function main () {
  const provider = new ProvierFactory('wss://westend-opal.unique.network', TypeProvider.WESTEND);
  const api =  await provider.getApi();

  const bridgeAPI = (new BridgeAPI(api)).bridgeAPI;
  
  const token = await bridgeAPI.getToken(320, 2);

  console.log(token);
}

main();

/**
 * 
 * 
 * {
  owner: { ethereum: '0xa0df350d2637096571f7a701cbc1c5fde30df76a' },
  constData: '0x',
  variableData: '0x'
}

{
  owner: { ethereum: '0xa0df350d2637096571f7a701cbc1c5fde30df76a' },
  constData: '0x687474703a2f2f6c6f63616c686f73743a333030312f696d616765732f31656464636232323338663363633261363863613666646337396162393535392e6a7067',
  variableData: '0x'
}

 * {
  owner: {
    Ethereum: 0x44b5588f160baa734024df93e59504e60c8f9293
  }
  constData: https://opensea.usetech.pro/images/3d5b8f81150a883eec81ed5aa0cbfcf6.png
  variableData: 
}
{
  owner: {
    Ethereum: 0xa0df350d2637096571f7a701cbc1c5fde30df76a
  }
  constData: test
  variableData: 
} 
{
  owner: {
    Substrate: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  }
  constData: 
  variableData: 
}
 */


