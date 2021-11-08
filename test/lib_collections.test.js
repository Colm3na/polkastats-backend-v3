const collection = require('../lib/collections.js');

const mockToken = jest.fn()

const sequelize = {
  query: mockToken
}


describe("Test for library of collection", () => {

    beforeEach(() => {
      sequelize.query.mockReset();
    })

    describe("Test method get", () => {

      const selectList = ['collection_id', 'name'];

      test("check on one record", async () => {      
        sequelize.query.mockImplementation((query, options) => {
          console.log(query);
          expect(query.includes(selectList.join(','))).toBe(true);
          expect(options).toMatchObject({plain: true});                      
          return {};
        })
        await collection.get({
          collectionId: 2,
          selectList: ['collection_id', 'name'],
          sequelize
        });        
      })

      test("check on array collections", async () => {
        sequelize.query.mockImplementation((query, options) => {
          console.log(query);
          expect(query.includes(selectList.join(','))).toBe(true);
          expect(options).toMatchObject({plain: false});
          return [];
        })
        await collection.get({          
          selectList: ['collection_id', 'name'],
          sequelize
        }); 
      })
    })

})