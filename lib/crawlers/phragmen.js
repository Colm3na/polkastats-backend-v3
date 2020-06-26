// @ts-check
const pino = require('pino');
const fs = require('fs');
const { exec } = require('child_process');

const DEFAULT_PHRAGMEN_OUTPUT_DIR = '/tmp/phragmen';
const DEFAULT_OFFLINE_PHRAGMEN_PATH = 'offline-phragmen';
const DEFAULT_POLLING_TIME_MS = 20 * 60 * 1000;

const logger = pino();

const loggerOptions = {
  crawler: `phragmen`
};

/**
 * start fetch some information from the blockchain using Polkadot API, use
 * the collected data to run "offline-phragmen" binary and stores the output
 * on the database.
 *
 * @param {object} api             Polkadot API object
 * @param {object} pool            Postgres pool object
 * @param {object} configTemplate  Configuration object
 */
async function start(api, pool, configTemplate) {
  const config = buildConfig(configTemplate);

  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS;

  const startTime = new Date().getTime();
  logger.info(loggerOptions, `Running phragmen crawler...`);

  if (!fs.existsSync(config.phragmenOutputDir)) {
    fs.mkdirSync(config.phragmenOutputDir);
  }

  const blockHeight = await api.derive.chain.bestNumber();
  const cmd = `${config.offlinePhragmenPath} -n ${config.substrateNetwork} -u ${config.wsProviderUrl} staking --output ${config.phragmenOutputDir}/output.json > /dev/null`;

  exec(cmd, async (err) => {
    if (err) {
      throw err;
    }

    const phragmenOutput = fs.readFileSync(
      `${config.phragmenOutputDir}/output.json`,
    );
    if (phragmenOutput) {
      const timestamp = new Date().getTime();
      const sqlInsert = buildInsertQuery(
        blockHeight,
        phragmenOutput,
        timestamp,
      );

      await pool.query(sqlInsert);
    } else {
      logger.error(loggerOptions, `Error!`);
    }

    logExecutionTime(startTime);

    setTimeout(() => start(api, pool, config), pollingTime);
  });
}

////////////////////////////////////////////////////////////////////////////////
// Private functions
////////////////////////////////////////////////////////////////////////////////

function logExecutionTime(startTime) {
  const endTime = new Date().getTime();
  const executionTime = ((endTime - startTime) / 1000).toFixed(0);
  logger.info(loggerOptions, `Execution time: ${executionTime}s`);
}

////////////////////////////////////////////////////////////////////////////////
// Aux functions
////////////////////////////////////////////////////////////////////////////////

function buildConfig(config) {
  if (!config.wsProviderUrl) {
    throw Error('Error: "wsProviderUrl" is required');
  }

  return {
    substrateNetwork: config.substrateNetwork,
    wsProviderUrl: config.wsProviderUrl,
    pollingTime: config.pollingTime || DEFAULT_POLLING_TIME_MS,
    phragmenOutputDir: config.phragmenOutputDir || DEFAULT_PHRAGMEN_OUTPUT_DIR,
    offlinePhragmenPath:
    config.offlinePhragmenPath || DEFAULT_OFFLINE_PHRAGMEN_PATH,
  };
}

function buildInsertQuery(blockHeight, phragmenOutput, timestamp) {
  return `INSERT INTO phragmen (block_height, phragmen_json, timestamp)
          VALUES ('${blockHeight.toString()}', '${phragmenOutput}', '${timestamp}');`;
}

module.exports = { start };
