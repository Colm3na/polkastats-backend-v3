const api = {
  query: {
    nft: {
      async collectionById(collectionId) {
        return {
          Owner: "5CJV7Qqdwx5XSG4xSKAix84c32XaYAfamcX8mtAbp4ZSVUXm",
          Name: [102, 111, 114, 101, 118, 101, 114],
          Description: [
            67, 111, 108, 108, 101, 99, 116, 105, 111, 110, 32, 102, 111, 114,
            32, 102, 111, 114, 101, 118, 101, 114,
          ],
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

module.exports = {
  api
}