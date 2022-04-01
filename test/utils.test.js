const { bufferToJSON }  = require('../utils/utils.js');


describe("Test for function bufferToJSON", () => {

  test("check on empty", () => {
    const result = bufferToJSON(
      '0x'
    );
    expect(result).toBeNull();    
  })

  test("check on string", () => {
    const str = bufferToJSON(
      '0x345f343a'
    )    
    expect(str).toBeNull();
  })

  test("check on json", () => {
    const json = bufferToJSON(
      '0x7b22726f6f74223a7b224e616d65537472223a224279746573222c22496d61676548617368223a224279746573227d7d'
    )    
    expect(
      JSON.parse(json)
    ).toEqual(expect.any(Object))
  })

})