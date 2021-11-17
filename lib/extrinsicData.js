function get ({
  blockNumber, 
  extrinsic,
  index, 
  success
}) {
  
  const result = {};
  result.block_number = blockNumber;
  result.extrinsic_index = index;  
  result.args = JSON.stringify(extrinsic.args);
  result.hash = extrinsic.hash.toHex();
  result.doc = extrinsic.meta.docs.toString().replace(/'/g, "''");
  result.success = success;

  return Object.assign(result, 
      getSigned(),
      getMethod(),
  );

  function getSigned() {
    const isSigned = extrinsic.isSigned;
    const result = {};
    result.is_signed = isSigned;
    result.signer = isSigned ? extrinsic.signer.toString() : "";
    return result;
  }

  function getMethod() {
    const method = extrinsic.toHuman().method;
    const result = {};    
    result.section = method.section;
    result.method = method.method;
    return result;
  }
}

module.exports = Object.freeze({
  get
});