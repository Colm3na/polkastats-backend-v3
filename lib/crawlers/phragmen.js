module.exports = {
  phragmen: async function (api, pool, config) {
    
    // Start execution time
    const startTime = new Date().getTime();

    const [blockHeight, validatorCount, minimumValidatorCount] = await Promise.all([
      api.derive.chain.bestNumber(),
      api.query.staking.validatorCount(),
      api.query.staking.minimumValidatorCount()
    ]);

    const phragmenCmd = spawnSync(`${config.offlinePhragmenPath}`, [ '-c', validatorCount.toString(), '-m', minimumValidatorCount.toString() ]);
    const phragmen = phragmenCmd.stdout.toString();

    if (phragmen) {
      console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[32mOutput: ${phragmen}s\x1b[0m`);
      var sqlInsert = `INSERT INTO phragmen (block_height, phragmen_json, timestamp) VALUES ('${blockHeight.toString()}', '${phragmen}', UNIX_TIMESTAMP());`;
      await pool.query(sqlInsert);
    } else {
      console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[31mError!\x1b[0m`);
    }

    // Execution end time
    const endTime = new Date().getTime();

    // 
    // Log execution time
    //
    console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[32mExecution time: ${((endTime - startTime) / 1000).toFixed(0)}s\x1b[0m`);
    console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[32mNext execution in 5m...\x1b[0m`);
    setTimeout(module.exports.blockHarvester(api, pool, config), config.PHRAGMEN_POLLING_TIME);
  }
}