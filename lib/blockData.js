function getTimestampFromExtrinsics(extrinsics) {
  for (const extrinsic of extrinsics) {
    const method = extrinsic.method;
    if (method.section === 'timestamp' && method.method === 'set') {
      return method.toJSON().args.now;
    }
  }
}

async function get({
  blockNumber, bridgeAPI
}) {

  const blockHash = await bridgeAPI.getBlockHash(blockNumber);

  const blockInfo = await getDataBlock(blockHash);

  return blockInfo;

  async function getDataBlock ( blockHash ) {
    const [
      { block },
      totalIssuance,
    ] = await Promise.all([
      bridgeAPI.api.rpc.chain.getBlock(blockHash),
      bridgeAPI.api.query.balances.totalIssuance.at(blockHash),
    ]);

    const timestamp = getTimestampFromExtrinsics(block.extrinsics);

    const result = {};  
    result.timestamp = timestamp;
    result.blockHash = blockHash;
    result.extrinsics = block.extrinsics;
    result.totalIssuance = totalIssuance.toString();    

    result.stateRoot = block.header.stateRoot.toString();
    result.extrinsicsRoot = block.header.extrinsicsRoot.toString();
    result.parentHash = block.header.parentHash.toString();

    const runtimeVersion = await getRuntimeVersion(blockHash);

    return Object.assign(result, runtimeVersion);
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