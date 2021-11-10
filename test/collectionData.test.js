const collectionData = require('../lib/collectionData.js');
const { api } = require('./utils/index.js');

const mockColletion = jest.fn();

describe("Test class CollectionData", () => {
    
    test("get collection by Id", async () => {
      const collection = await collectionData.get(10, api);
      console.log(collection);
      expect(collection).toMatchObject({
        collection_id: expect.any(Number),
        owner: expect.any(String),
        name: expect.any(String),
        constChainSchema: expect.any(String),
        limitsAccoutOwnership: expect.any(Number),  
        limitsSponsoreDataSize: expect.any(Number),      
        ownerCanTrasfer: expect.any(Boolean),
        ownerCanDestroy: expect.any(Boolean),
        sponsorshipConfirmed: expect.any(String),
        schemaVersion: expect.any(String),
        tokenPrefix: expect.any(String),
        mode: expect.any(String)
      });      
    })

})