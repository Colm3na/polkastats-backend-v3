function get ({
  blockNumber, 
  extrinsic,
  index, 
  success
}) {
  
  const prepareData = {};
  prepareData.block_number = blockNumber;
  prepareData.extrinsic_index = index;  
  prepareData.args = JSON.stringify(extrinsic.args);
  prepareData.hash = extrinsic.hash.toHex();
  prepareData.doc = extrinsic.meta.docs.toString().replace(/'/g, "''");
  prepareData.success = success;

  const result = Object.assign(prepareData, 
    getSigned(),
    getMethod(),
  );

  if (
    ['transfer', 'transferAll', 'transferKeepAlive', 'vestedTransfer'].includes(
      result.method
    )
  ) {
    /*console.log(extrinsic.args);
    console.log(extrinsic.args[0].toJSON())
    console.log(extrinsic.args[0].toString())
    console.log(extrinsic.args[1].toJSON())
    console.log(extrinsic.args[1].toString())*/
  }

  return result;

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