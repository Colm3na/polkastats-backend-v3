const EventFacade = require('../lib/crawlers/eventFacade.js')
const { api } = require('./utils.js')

const mockCollection = jest.fn()

const pool = {
    query: mockCollection       
}  

describe('Test class EventFaced', () => {

  beforeEach(() => {
    pool.query.mockReset()
  })
  
  test('Test on create collection', async () => {     
     const event =  {
      "block_number": 2806298,      
      "method": "CollectionCreated",      
      "data": "[165,1,\"5CJV7Qqdwx5XSG4xSKAix84c32XaYAfamcX8mtAbp4ZSVUXm\"]"
    };   
    const eventFacade = new EventFacade(api, pool);
    pool.query.mockReturnValueOnce({
      rows: []
    }).mockImplementation((query) => {
      console.log(query)
    })

    await eventFacade.saveCollection(JSON.parse(event.data));
  })

  test('Test on transfer item', async () => {    
    const event = {
      "block_number": 2802800,
      "event_index": 4,
      "section": "nft",
      "method": "Transfer",
      "phase": "{\"applyExtrinsic\":1}",
      "data": "[112,14,\"5DACuDR8CXXmQS3tpGyrHZXoJ6ds7bjdRb4wVqqSt2CMfAoG\",\"5F9uj74cgfo3FX4UbMzivGSnNzDvjuFgCYGhhAcYo3mjk1zT\",0]"
    };
    pool.query.mockImplementation((query) => {
      console.log(query)
    })
    const eventFacade = new EventFacade(api, pool);
    await eventFacade.transferToken(JSON.parse(event.data));
  })  
  
  test('Test on create item on collection', async () => {    
    const event = {
      "block_number": 2834690,      
      "method": "ItemCreated",      
      "data": "[191,1,\"5HYwn1rHFsv4bfsxhGKNTSWvu2kup8Fo5q73a9eKm3pFzwbD\"]"
    };
    
    pool.query.mockReturnValueOnce({
      rows: []
    }).mockImplementation((query) => {
      console.log(query)
    })

    const eventFacade = new EventFacade(api, pool);
    await eventFacade.insertToken(JSON.parse(event.data));
  })
  
  test('Test on destory item on collection', async () => {    
    const event  =   {
      "block_number": 2834924,
      "event_index": 1,
      "section": "nft",
      "method": "ItemDestroyed",
      "phase": "{\"applyExtrinsic\":1}",
      "data": "[191,1]"
    }

    pool.query.mockImplementation((query) => {
      console.log(query)
    })
    
    const eventFacade = new EventFacade(api, pool);
    await eventFacade.delToken(JSON.parse(event.data));       
  })

})