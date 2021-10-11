const { getCollection, insertCollection, saveCollection } = require("../lib/crawlers/collectionListener");
const { api } = require('./utils.js')

const mockCollection = jest.fn()

const pool = {
    query: mockCollection       
}     


describe("Test class Collection Listener", () => {

  beforeEach(() => {
    pool.query.mockReset()
  })

  test("getCollection", async () => {
    const collection = await getCollection(api, 10);    
    expect(collection).toMatchObject({
      collection_id: expect.any(Number),
      owner: expect.any(String),
      name: expect.any(String),
    });

    expect(collection).toMatchObject({ collection_id: 10 });
  });

  test("insertCollection", async () => {

    const collection = await getCollection(api, 10)
    
    expect(collection).toMatchObject({ collection_id: 10 })
    
    await insertCollection(collection, pool)
    
    expect(pool.query.mock.calls.length).toBe(1)
  })

  test("test function saveCollection on insert", async () => {     
     const collection = await getCollection(api, 10)

     pool.query.mockReturnValueOnce({
       rows: []
     }).mockImplementation((query) => {
       console.log(query)
     })

     await saveCollection({
       collection, 
       pool
     })     
  })

  test("test function saveCollection on update", async () => {     
    const collection = await getCollection(api, 10)
    
    pool.query.mockReturnValueOnce({
      rows: [{
        ...collection,
        name: null
      }]
    }).mockImplementation((query) => {
      console.log(query)
    })

    await saveCollection({
      collection, 
      pool
    })           
 })
});
