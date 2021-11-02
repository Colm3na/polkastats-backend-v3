const { getToken } = require('../crawlers/tokenListener.js');
const { api } = require('./utils/index.js');

const mockToken = jest.fn()

const sequelize = {
  query: mockToken
}

describe("Test tokenListener", () => {
  beforeEach(() => {
    sequelize.query.mockReset()
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
})

