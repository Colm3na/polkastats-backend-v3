const { getAmount } = require('../utils/utils.js');

async function get({
  bridgeAPI,
  blockHash,
}) {
  const result = {};
  
  const blockEvents = await bridgeAPI.api.query.system.events.at(blockHash);
  
  result.blockEvents =  blockEvents;

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

async function events(events, callback) {
  return await events.forEach(callback) 
};

function amount(event) {  
  const sections = ['balances'];
  const { method, data, section } = event;

  let result = 0;

  if (sections.includes(section)) {
    switch (method) {
      case 'Transfer': {
        result = getAmount(data[2].toString());
      } break;
      case 'Deposit': {
        result = getAmount(data[1].toString());
      } break;      
      default: 
        result = 0;
      break;
    }
  }
  return result  
};

function parseRecord(record) {
  const { event, phase, blockNumber } = record;
  const result = {};

  result.section = event.section;
  result.method = event.method;
  result.phase = phase.toString(),
  result.data = JSON.stringify(event.data),
  result.amount = amount(event);
  result._event = event;
  result._phase = phase;
  result.block_index = null;
  
  try {
    const phase = JSON.parse(result.phase);
    if (phase && phase['applyExtrinsic'] !== undefined) {
      result.block_index = `${blockNumber}-${phase['applyExtrinsic']}`;
    }
  } catch {
    // Maybe we should do something with this error? But its't critical case.
  }
  return result;
}


module.exports = Object.freeze({
  get, 
  events,
  amount,
  parseRecord,
})