const pino = require("pino");
const BigNumber = require("bignumber.js");
const { QueryTypes } = require("sequelize");
const { encodeAddress, decodeAddress } = require('@polkadot/util-crypto');

const logger = pino();

const ETHEREUM_ADDRESS_MAX_LENGTH = 42;

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function shortHash(hash) {
  return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
}

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getExtrinsicSuccess(index, blockEvents) {
  // assume success if no events were extracted
  if (blockEvents.length === 0) {
    return true;
  }
  let extrinsicSuccess = false;
  blockEvents.forEach((record) => {
    const { event, phase } = record;
    if (
      parseInt(phase.toHuman().ApplyExtrinsic) === index &&
      event.section === `system` &&
      event.method === `ExtrinsicSuccess`
    ) {
      extrinsicSuccess = true;
    }
  });
  return extrinsicSuccess;
}

function getDisplayName(identity) {
  if (
    identity.displayParent &&
    identity.displayParent !== `` &&
    identity.display &&
    identity.display !== ``
  ) {
    return `${identity.displayParent} / ${identity.display}`;
  } else {
    return identity.display || ``;
  }
}

function getBuffer(aValue) {  
  return Buffer.from(aValue, "hex").toString("utf-8");
}

function avoidUseBuffer(buf) {
    let str = '';
    for (let i = 0, strLen = buf.length; i < strLen; i++) {
      if (buf[i] !== 0) {
        str += String.fromCharCode(buf[i]);
      } else {
        break;
      }
    }
    return str;
}

function parseHexToString(value) {
  try {
    const source = value.toString().replace("0x", "");
    return getBuffer(source);
  } catch (error) {
    return "";
  }
}

function bufferToString(value) {
  try {
    if (value.length === 0 || value.length <= 3) {
      return "";
    }
    if (value.join("").includes("123")) {
      return "";
    }
    return getBuffer(value);
  } catch (error) {
    return "";
  }
}

function genArrayRange(min, max) {
  return Array.from(
    { length: max - min },
    (_, i) => i + ((min === 0 ? -1 : min - 1) + 1)
  );
}

/**
 * Convert buffer to JSON object
 * @param {string} value 
 * @returns 
 */
 const bufferToJSON = function(value)  {
  try {
    const data = parseHexToString(value)
    let result = null;
    if (data === '')  {
      return result;
    } else {
      return (typeof JSON.parse(data) === 'object') ? data : null
    }    
  } catch (err) {    
    return null;
  }
}

function getAmount(strNum) {
  
  BigNumber.config({
    EXPONENTIAL_AT: [-30, 30]
  });

  let result = BigNumber(strNum);
  let dividedBy = result.dividedBy('1000000000000000000').toString();
  return dividedBy;
}

function normalizeSubstrateAddress(address) {
  if (address?.length <= ETHEREUM_ADDRESS_MAX_LENGTH) {
    return address;
  }

  return encodeAddress(decodeAddress(address));
}


module.exports = {
  formatNumber,
  shortHash,
  wait,
  genArrayRange,
  bufferToString,
  parseHexToString,
  avoidUseBuffer,
  getDisplayName,
  getExtrinsicSuccess,
  bufferToJSON,
  getAmount,
  normalizeSubstrateAddress,
};
