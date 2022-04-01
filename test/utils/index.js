const api = {
  query: {
    nft: {
      async collectionById(collectionId) {
        return {
          Owner: '5GsQY3MEVGaVChCkTS1RQZxbWhuStS2tHwDCknH8c9n2S9CP',
          Mode: { nft: null },
          Access: 'Normal',
          DecimalPoints: 0,
          Name: [
             83, 117, 98, 115, 116,
            114,  97, 80, 117, 110,
            107, 115
          ],
          Description: [
             70, 105, 114, 115, 116,  32,  78,  70,
             84,  32,  99, 111, 108, 108, 101,  99,
            116, 105, 111, 110,  32, 105, 110,  32,
            112, 111, 108, 107,  97, 100, 111, 116,
             32, 115, 112,  97,  99, 101
          ],
          TokenPrefix: '0x504e4b',
          MintMode: false,
          OffchainSchema: '0x68747470733a2f2f64697369676e6174686f6e2e303030776562686f73746170702e636f6d2f626c75652f7b69647d2e6a7067',
          SchemaVersion: 'ImageURL',
          Sponsorship: { confirmed: '5GsQY3MEVGaVChCkTS1RQZxbWhuStS2tHwDCknH8c9n2S9CP' },
          Limits: {
            AccountTokenOwnershipLimit: 1000000,
            SponsoredDataSize: 2048,
            SponsoredDataRateLimit: null,
            TokenLimit: 10000,
            SponsorTimeout: 1,
            OwnerCanTransfer: true,
            OwnerCanDestroy: true
          },
          VariableOnChainSchema: '0x',
          ConstOnChainSchema: '0x7b226e6573746564223a7b226f6e436861696e4d65746144617461223a7b226e6573746564223a7b224e46544d657461223a7b226669656c6473223a7b226e616d65223a7b226964223a312c2272756c65223a227265717569726564222c2274797065223a22737472696e67227d7d7d7d7d7d7d'
        }
      },
      async nftItemList(collectionId, tokenId) {
        return {
          Owner: '5DACuDR8CXXmQS3tpGyrHZXoJ6ds7bjdRb4wVqqSt2CMfAoG',
          ConstData: '0x0a1762616c752d6761737061722d6838334d384633346d6a41',
          VariableData:null
        }
      }      
    },
  },
};

module.exports = { api }