const protobuf = require('../utils/protobuf.js')


describe("Test protobuf", () => {

  const schema = "{\"nested\": {\"onChainMetaData\": {\"nested\": {\"NFTMeta\": {\"fields\": {\"name\": {\"id\": 1, \"rule\": \"required\", \"type\": \"string\"}}}}}}}";

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
        protobuf.getProtoBufRoot( schema )
      ).toEqual(
        expect.any(Object)
      )
    })
  })
  
  describe("deserializeNFT", () => {  
    test("Checking for parse token", () => {      
      const root = protobuf.getProtoBufRoot(schema);      
      const statementData = {
        buffer: Buffer.from('0a1863617365792d686f726e65722d534c73586a467034594741', 'hex'),
        locale: 'en',
        root        
      };
      
      const deserialize = protobuf.deserializeNFT(statementData)
      expect(deserialize).toEqual(expect.any(Object))      
    })
  })

})