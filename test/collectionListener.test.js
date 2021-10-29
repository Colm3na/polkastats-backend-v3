const { getCollection, insertCollection, saveCollection } = require('../crawlers/collectionListener.js')
const { api } = require('./utils.js')


const mockCollection = jest.fn()

const sequelize = {
    query: mockCollection       
}     


describe("Test class Collection Listener", () => {

  beforeEach(() => {
    sequelize.query.mockReset()
  })

  test("getCollection", async () => {
    const collection = await getCollection(api, 10);    
    console.log(collection);
    expect(collection).toMatchObject({
      collection_id: expect.any(Number),
      owner: expect.any(String),
      name: expect.any(String),
      constChainSchema: expect.any(Object),      
      limitsAccoutOwnership: expect.any(Number),  
      limitsSponsoreDataSize: expect.any(Number),      
      ownerCanTrasfer: expect.any(Boolean),
      ownerCanDestroy: expect.any(Boolean),
      sponsorshipConfirmed: expect.any(String),
      schemaVersion: expect.any(String),
      tokenPrefix: expect.any(String),
      mode: expect.any(String)
    });

    expect(collection).toMatchObject({ collection_id: 10 });
  });

  test("insertCollection", async () => {

    const collection = await getCollection(api, 10)
    
    expect(collection).toMatchObject({ collection_id: 10 })
    
    await insertCollection(collection, sequelize)
    
    expect(sequelize.query.mock.calls.length).toBe(1)
  })

  test("test function saveCollection on insert", async () => {     
     const collection = await getCollection(api, 10)

     sequelize.query.mockReturnValueOnce(null)
     .mockImplementation((query) => {
       console.log(query)
     })

     await saveCollection({
       collection, 
       sequelize
     })     
  })

  test("test function saveCollection on update", async () => {     
    const collection = await getCollection(api, 10)
    
    sequelize.query.mockReturnValueOnce({
      rows: [{
        ...collection,
        name: null
      }]
    }).mockImplementation((query) => {
      console.log(query)
    })

    await saveCollection({
      collection, 
      sequelize
    })           
 })
});
