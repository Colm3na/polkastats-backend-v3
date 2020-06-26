const pino = require('pino');
const logger = pino();

module.exports = {
  formatNumber: function (number) {
    return (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  },
  shortHash: function (hash) {
    return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
  },
  wait: async function (ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  },
  storeExtrinsics: async function (pool, blockNumber, extrinsics, blockEvents) {

    extrinsics.forEach(async (extrinsic, index) => {

      const isSigned = extrinsic.isSigned;
      const signer = isSigned ? extrinsic.signer.toString() : ``;
      const section = extrinsic.toHuman().method.section;
      const method = extrinsic.toHuman().method.method;
      const args = JSON.stringify(extrinsic.args);
      const hash = extrinsic.hash.toHex();
      const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");
      const success = module.exports.getExtrinsicSuccess(index, blockEvents)

      logger.info(`Parsed extrinsic ${blockNumber}-${index} isSigned: ${isSigned} signer: ${signer} section: ${section} method: ${method} hash: ${hash} success: ${success}`);
      
      const sql = 
        `INSERT INTO extrinsic (
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
          '${blockNumber}',
          '${index}',
          '${isSigned}',
          '${signer}',
          '${section}',
          '${method}',
          '${args}',
          '${hash}',
          '${doc}',
          '${success}'
        )
        ON CONFLICT ON CONSTRAINT extrinsic_pkey 
        DO NOTHING;
        ;`;

      try {
        await pool.query(sql);
        logger.info(`Added extrinsic ${blockNumber}-${index}`);
        return true;
      } catch (error) {
        logger.error(`Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
        return false;
      }
    });
  },
  getExtrinsicSuccess: function (index, blockEvents) {
    blockEvents.forEach((record) => {
      const { event, phase } = record
      if (
        parseInt(phase.toHuman().ApplyExtrinsic) === index &&
        event.section === `system` &&
        event.method === `ExtrinsicSuccess`
      ) {
        return true
      }
    })
    return false
  }
};