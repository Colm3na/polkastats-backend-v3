import { ApiPromise, WsProvider } from '@polkadot/api';
let api = null

beforeAll(async () => {  
  const provider = new WsProvider('wss://testnet2.uniquenetwork.io')
  const rtt = nul
  api = await ApiPromise.create({ provider, types: rtt })
})

describe('collectionListener', () => { 
  test('test', () => {
    console.log('->', api)
    console.log('2 -test')
  })
})