const { spawnSync } = require('child_process');
const fs = require('fs');

const DEFAULT_PHRAGMEN_OUTPUT_DIR = '/tmp/phragmen';
const DEFAULT_OFFLINE_PHRAGMEN_PATH = 'offline-phragmen';
const DEFAULT_POLLING_TIME = 5 * 60 * 1000;

/**
 * phragmen fetch some information from the blockchain using Poladot API, use
 * the collected data to run "offline-phragmen" binary and stores the output
 * on the database.
 *
 * @param {object} api             Polkadot API object
 * @param {object} pool            Postgres pool object
 * @param {object} configTemplate  Configuration object
 */
async function phragmen(api, pool, configTemplate) {
  const config = buildConfig(configTemplate);

  const startTime = new Date().getTime();
  log('\x1b[32mRunning phragmen crawler...\x1b[0m');

  if (!fs.existsSync(config.phragmenOutputDir)) {
    fs.mkdirSync(config.phragmenOutputDir);
  }

  const promises = Promise.all([
    api.derive.chain.bestNumber(),
    api.query.staking.validatorCount(),
    api.query.staking.minimumValidatorCount(),
  ]);
  const [blockHeight, validatorCount, minimumValidatorCount] = await promises;

  const phragmenArgs = buildPhragmenArgs(
    api.wsProviderUrl,
    config.phragmenOutputDir,
    validatorCount,
    minimumValidatorCount,
  );
  const result = spawnSync(config.offlinePhragmenPath, phragmenArgs);
  if (result.error) {
    throw result.error;
  }

  const phragmenOutput = fs.readFileSync(
    `${config.phragmenOutputDir}/output.json`,
  );
  if (phragmenOutput) {
    const timestamp = new Date().getTime();
    const sqlInsert = buildInsertQuery(blockHeight, phragmenOutput, timestamp);

    await pool.query(sqlInsert);
  } else {
    log('\x1b[31mError!\x1b[0m');
  }

  logExecutionTime(startTime);

  setTimeout(() => phragmen(api, pool, config), config.pollingTime);
}

////////////////////////////////////////////////////////////////////////////////
// Private functions
////////////////////////////////////////////////////////////////////////////////

function logExecutionTime(startTime) {
  const endTime = new Date().getTime();
  const executionTime = ((endTime - startTime) / 1000).toFixed(0);
  log(`\x1b[32mExecution time: ${executionTime}s\x1b[0m`);
  log(`\x1b[32mNext execution in 5m...\x1b[0m`);
}

////////////////////////////////////////////////////////////////////////////////
// Aux functions
////////////////////////////////////////////////////////////////////////////////

function buildConfig(config) {
  if (!config.wsProviderUrl) {
    throw Error('Error: "wsProviderUrl" is required');
  }

  return {
    wsProviderUrl: config.wsProviderUrl,
    pollingTime: config.pollingTime || DEFAULT_POLLING_TIME,
    phragmenOutputDir: config.phragmenOutputDir || DEFAULT_PHRAGMEN_OUTPUT_DIR,
    offlinePhragmenPath:
      config.offlinePhragmenPath || DEFAULT_OFFLINE_PHRAGMEN_PATH,
  };
}

function buildPhragmenArgs(
  wsProviderUrl,
  phragmenOutputDir,
  validatorCount,
  minimumValidatorCount,
) {
  return [
    '-c',
    validatorCount.toString(),
    '-m',
    minimumValidatorCount.toString(),
    '--uri',
    wsProviderUrl,
    '-o',
    `${phragmenOutputDir}/output.json`,
  ];
}

function buildInsertQuery(blockHeight, phragmenOutput, timestamp) {
  return `INSERT INTO phragmen (block_height, phragmen_json, timestamp)
          VALUES ('${blockHeight.toString()}', '${phragmenOutput}', '${timestamp}');`;
}

function log() {
  console.log('[PolkaStats backend v3] - Phragmen crawler - ', ...arguments);
}

module.exports = { phragmen };
