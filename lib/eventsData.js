async function get({
  bridgeAPI,
  blockHash,
}) {
  const result = {};
  
  const blockEvents = await bridgeAPI.api.query.system.events.at(blockHash);
  
  result.blockEvents =  blockEvents;
  result.eraElectionStatus = await eraElectionStatus(bridgeAPI);

  result.numTransfers = blockEvents.filter(
    (record) =>
      record.event.section === `balances` &&
      record.event.method === `Transfer`
  ).length || 0;

  result.newAccounts = blockEvents.filter(
    (record) =>
      record.event.section === `balances` &&
      record.event.method === `Endowed`
  ).length || 0;

  return result;
}

async  function eraElectionStatus(bridgeAPI) {
  return await bridgeAPI.api.query?.staking?.eraElectionStatus() || null;
}

async function events(events, callback) {
  return await events.forEach(callback) 
};


module.exports = Object.freeze({
  get, 
  events,
})