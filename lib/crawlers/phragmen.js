// @ts-check
const { spawnSync } = require('child_process');
const fs = require('fs');

const DEFAULT_PHRAGMEN_OUTPUT_DIR = '/tmp/phragmen';
const DEFAULT_OFFLINE_PHRAGMEN_PATH = 'offline-phragmen';

module.exports = {
  async phragmen(api, pool, config) {
    if (!config) {
      return;
    }

    log('\x1b[32mStarting phragmen crawler...\x1b[0m');

    const phragmenOutputDir =
      config.phragmenOutputDir || DEFAULT_PHRAGMEN_OUTPUT_DIR;
    const offlinePhragmenPath =
      config.offlinePhragmenPath || DEFAULT_OFFLINE_PHRAGMEN_PATH;

    if (!fs.existsSync(phragmenOutputDir)) {
      fs.mkdirSync(phragmenOutputDir);
    }

    const startTime = new Date().getTime();

    const promises = Promise.all([
      api.derive.chain.bestNumber(),
      api.query.staking.validatorCount(),
      api.query.staking.minimumValidatorCount(),
    ]);
    const [blockHeight, validatorCount, minimumValidatorCount] = await promises;

    const phragmenArgs = buildPhragmenArgs(
      config.wsProviderUrl,
      phragmenOutputDir,
      validatorCount,
      minimumValidatorCount,
    );
    const result = spawnSync(offlinePhragmenPath, phragmenArgs);
    if (result.error) {
      throw result.error;
    }

    const phragmenOutput = fs.readFileSync(`${phragmenOutputDir}/output.json`);
    if (phragmenOutput) {
      const timestamp = new Date().getTime();
      const sqlInsert = buildInsertQuery(
        blockHeight,
        phragmenOutput,
        timestamp,
      );

      await pool.query(sqlInsert);
    } else {
      log('\x1b[31mError!\x1b[0m');
    }

    // Execution end time
    const endTime = new Date().getTime();

    //
    // Log execution time
    //
    const executionTime = ((endTime - startTime) / 1000).toFixed(0);
    log(`\x1b[32mExecution time: ${executionTime}s\x1b[0m`);
    log(`\x1b[32mNext execution in 5m...\x1b[0m`);
  },
};

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
