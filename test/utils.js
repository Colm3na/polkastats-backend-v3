export const api = {
  query: {
    nft: {
      async collectionById(collectionId) {
        return {
          Owner: "5GsQY3MEVGaVChCkTS1RQZxbWhuStS2tHwDCknH8c9n2S9CP",
          Mode: "NFT",
          Access: "Normal",
          DecimalPoints: 0,
          Name: [83, 117, 98, 115, 116, 114, 97, 80, 117, 110, 107, 115 ],
          Description: [70,105,114,115,116,32,78,70,84,32,99,111,108,108,101,99,116,105,111,110,32,105,110,32,112, 111,108,107,97,100,111,116,32,115,112,97,99,101],
          TokenPrefix: "PNK",
          MintMode: false,
          OffchainSchema: '0x7b226d6574616461746122203a202268747470733a2f2f77686974656c6162656c2e6d61726b65742f6d657461646174612f7b69647d227d',
          Limits: {
            AccountTokenOwnershipLimit: 10000,
            SponsoredDataSize: 2048,
            SponsoredDataRateLimit: null,
            TokenLimit: 10000,
            SponsorTimeout: 14400,
            OwnerCanTransfer: true,
            OwnerCanDestroy: true,
          },
          VariableOnChainSchema: null,
          ConstOnChainSchema: null
        };
      },
      async nftItemList(collectionId, tokenId) {
        return {
          Owner: '5CJV7Qqdwx5XSG4xSKAix84c32XaYAfamcX8mtAbp4ZSVUXm',
          ConstData: '0x08b603109109188c0520a40728013209313935332d323030363a083035393030316237407d4a06c302f301a501',
          VariableData:null
        }
      }
    },
  },
};