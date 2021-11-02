const protobuf = require('../utils/protobuf.js')


describe("Test protobuf", () => {

  describe("getProtoBufRoot", () => {

    test("Checkin for the empty schema", () => {

      expect(
        protobuf.getProtoBufRoot(null)
      ).toBeNull()

    })

    test("Checking for the wrong schema", () => {

      expect(
        protobuf.getProtoBufRoot(
          "{\"AccessMode\": {\"_enum\": [\"Normal\", \"WhiteList\"]}}"
        )
      ).toBeNull()      

      expect(
        protobuf.getProtoBufRoot(
          "{\"root\": {\"NameStr\": \"Bytes\", \"ImageHash\": \"Bytes\"}}"
        )
      ).toBeNull()
    })

    test("Checking for the right schema", () => {
      expect(
        protobuf.getProtoBufRoot(
          "{\"nested\": {\"onChainMetaData\": {\"nested\": {\"NFTMeta\": {\"fields\": {\"name\": {\"id\": 1, \"rule\": \"required\", \"type\": \"string\"}}}}}}}"
        )
      ).toEqual(
        expect.any(Object)
      )
    })
  })
  
  describe("deserializeNFT", () => {
    test("Checking for parse token", () => {
      
    })
  })

})