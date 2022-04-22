const pino = require('pino');
const logger = pino();
const extrinsicDB = require('../lib/extrinsicDB.js');
const extrinsicData = require('../lib/extrinsicData.js');
const { getExtrinsicSuccess } = require('../utils/utils');

async function save(
  sequelize,
  blockNumber,
  extrinsics,
  blockEvents,
  timestampMs,
  loggerOptions,
) {
  const startTime = new Date().getTime();
  extrinsics.forEach(async (extrinsic, index) => {

    const item = extrinsicData.get({
      blockNumber,
      extrinsic,
      index,
      success: getExtrinsicSuccess(index, blockEvents),
      timestamp: timestampMs
    });

    if (['setValidationData'].includes(item.method)) {
      item.args = '[]';
    }

    await extrinsicDB.save({
      extrinsic: item,
      sequelize
    });

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

module.exports = Object.freeze({
  save
});