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

function amount(event) {
  const transfers = ['transfer', 'transferAll', 'transferKeepAlive', 'vestedTransfer'];
  const {method, data} = event;

  let result = 0;

  if (transfers.includes(method)) {
    result = data[2].toString().replace('000000000000000000','');
  }

  return result  
};

function parseRecord(record) {
  const { event, phase } = record;
  const result = {};

  result.section = event.section;
  result.method = event.method;
  result.phase = phase.toString(),
  result.data = JSON.stringify(event.data),
  result.amount = amount(event);
  result._event = event;
  result._phase = phase;
  
  return result;
}


module.exports = Object.freeze({
  get, 
  events,
  amount,
  parseRecord,
})