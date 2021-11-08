const { getToken, getCollections, addRange } = require('../crawlers/tokenListener.js');
const { api } = require('./utils/index.js');

const mockSequelize = jest.fn()
const mockToken = jest.fn()

const sequelize = {
  query: mockSequelize
}

const mockApi = {
  query: {
    nft: {
      itemListIndex: mockToken
    }
  }
}

describe("Test tokenListener", () => {
  beforeEach(() => {
    sequelize.query.mockReset()
    mockApi.query.nft.itemListIndex.mockReset();
  })

  describe("getToken", () => {
    
    test("checking token", async () => {
      const token = await getToken({
        api,
        collectionId: 1,
        tokenId: 1
      });

      expect(token).toMatchObject({
        owner: expect.any(String),
        constData: expect.any(String),
        collectionId: expect.any(Number),
        tokenId: expect.any(Number)
      })
    })
    
  })

  describe("collections", () => {
    
    beforeEach(() => {
      sequelize.query.mockImplementation((query) => {
        console.log(query);
        return [
          {
            collection_id: 1,
            const_chain_schema: null
          },
          {
            collection_id: 2,
            const_chain_schema: "{\"nested\": {\"onChainMetaData\": {\"nested\": {\"NFTMeta\": {\"fields\": {\"name\": {\"id\": 1, \"rule\": \"required\", \"type\": \"string\"}}}}}}}"
          }
        ]
      });      
    });
    describe("getCollections", () => {
      test("check on records of collection", async () => {        
        const collections = await getCollections(sequelize);        
        expect(collections).toEqual(expect.any(Array));
        expect(collections).toEqual([
          expect.anything(),
          expect.objectContaining({
            collectionId: expect.any(Number),
            schema: expect.any(Object)
          })
        ])
      })
    });

    describe("addRange", () => {
      test("check on recrods of collection", async () => { 
        mockApi.query.nft.itemListIndex.mockImplementation((collectionId) => {
          if (collectionId === 1) {
            return 0;
          }
          if (collectionId === 2) {
            return 6
          }
        })
        const range = addRange(mockApi, sequelize);                
        for await (const item of range) {
          console.log(item);
          expect(item).toMatchObject({
            collectionId: expect.any(Number),
            range: expect.any(Array)
          })
        }
      })
    })

  })

})

