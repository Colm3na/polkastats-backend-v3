async function get({
  blockNumber, bridgeAPI
}) {

  const blockHash = await bridgeAPI.getBlockHash(blockNumber);

  const blockInfo = await getDataBlock(blockHash);

  return blockInfo;

  async function getDataBlock ( blockHash ) {
    const [
      { block },
      blockNumberFinalized,          
      totalIssuance,
    ] = await Promise.all([
      bridgeAPI.api.rpc.chain.getBlock(blockHash),
      bridgeAPI.api.derive.chain.bestNumberFinalized(),            
      bridgeAPI.api.query.balances.totalIssuance.at(blockHash),
    ]);

    const result = {};  
    result.blockHash = blockHash;
    result.extrinsics = block.extrinsics;
    result.blockNumberFinalized = blockNumberFinalized.toString();    
    result.totalIssuance = totalIssuance.toString();    

    const blockAuthor = await getBlockAuthor(blockHash);
    const runtimeVersion = await getRuntimeVersion(blockHash);

    return Object.assign(result, blockAuthor, runtimeVersion);
  }

  async function getBlockAuthor (blockHash) {
    const extendedHeader = await bridgeAPI.api.derive.chain.getHeader(blockHash);    
    const result = {};
    result.blockAuthor = extendedHeader.author || null;
    result.stateRoot = extendedHeader.stateRoot.toString();
    result.extrinsicsRoot = extendedHeader.extrinsicsRoot.toString();
    result.parentHash = extendedHeader.parentHash.toString();

    const blockAuthorIdentity = await bridgeAPI.api.derive.accounts.info(result.blockAuthor);
    result.blockAuthorIdentity = blockAuthorIdentity;

    return result;
  }

  async function getRuntimeVersion(blockHash) {
    const runtimeVersion = await bridgeAPI.api.rpc.state.getRuntimeVersion(blockHash);
    const result = {};
    result.specName = runtimeVersion.specName.toString();
    result.specVersion = runtimeVersion.specVersion.toString();

    return result;
  }
}

async function last(bridgeAPI) {
  const blockNumber = await bridgeAPI.api.query.system.number();  
  return blockNumber.toNumber();
}

function check({
  sourceBlock,
  blockNumber,
  blockInfo,
}) {
  let result = false;
  const { blockHash, stateRoot } = blockInfo;
  if (
    sourceBlock.block_hash === blockHash.toString() &&
    sourceBlock.state_root === stateRoot.toString() &&
    Number(sourceBlock.block_number) === blockNumber
  ) {
    result = true;
  } else {
    result = false;
  }
  return result;
}

module.exports = Object.freeze({
  get,
  last,
  check
})