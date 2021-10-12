import pino from 'pino'
//import { BigNumber } from 'bignumber.js'
import Sequelize from 'sequelize'

const { QueryTypes } = Sequelize

const logger = pino()


export function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function shortHash(hash) {
  return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
}

export async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getExtrinsicSuccess (index, blockEvents) {
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
};

export async function storeExtrinsics(
  sequelize, 
  blockNumber,
  extrinsics,
  blockEvents,
  loggerOptions
) {
  // Start execution
  const startTime = new Date().getTime();
  extrinsics.forEach(async (extrinsic, index) => {
    const isSigned = extrinsic.isSigned;
    await sequelize.query(`INSERT INTO extrinsic (
      block_number,
      extrinsic_index,
      is_signed,
      signer,
      section,
      method,
      args,
      hash,
      doc,
      success
    ) VALUES (
      ':block_number',
      ':extrinsic_index',
      ':is_signed',
      ':signer',
      ':section',
      ':method',
      ':args',
      ':hash',
      ':doc',
      ':success'
    )
    ON CONFLICT ON CONSTRAINT extrinsic_pkey DO NOTHING;`, 
    {
      type: QueryTypes.INSERT,
      replacements: {
        block_number: blockNumber,
        extrinsic_index: index,
        is_signed: isSigned,
        signer: isSigned ? extrinsic.signer.toString() : ``,
        section: extrinsic.toHuman().method.section, 
        method: extrinsic.toHuman().method.method,
        args: JSON.stringify(extrinsic.args),
        hash: extrinsic.hash.toHex(),
        doc: extrinsic.meta.docs.toString().replace(/'/g, "''"), 
        success: getExtrinsicSuccess(index, blockEvents)
      }
    })    
  });

  // Log execution time
  const endTime = new Date().getTime();
  logger.info(
    loggerOptions,
    `Added ${extrinsics.length} extrinsics in ${(
      (endTime - startTime) /
      1000
    ).toFixed(3)}s`
  );
}

export async function storeLogs(  sequelize, 
  blockNumber,
  extrinsics,
  blockEvents,
  loggerOptions) {
    
  }

export async function updateTotals(sequelize) {
  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM collections) WHERE name ='collections'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM tokens) WHERE name ='tokens'`, { type: QueryTypes.UPDATE })
}

export function parseHexToString(value) {
  try {
    const source = value.toString().replace('0x', '')
    return Buffer(source, 'hex').toString('utf-8')
  } catch (error) {
    return ''
  }
}

export function bufferToString(value) {
  try {    
    if (value.length === 0 || value.length <= 3) {
      return ''
    }
    if (value.join('').includes('123')) {
      return ''
    }
    return Buffer(value, 'hex').toString('utf-8')
  } catch (error) {
    return ''
  }  
}

export function genArrayRange(min, max) {
  return Array.from(
    { length: max - min },
    (_, i) => i + ((min === 0 ? -1 : min - 1) + 1)
  );
}