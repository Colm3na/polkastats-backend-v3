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
  storeExtrinsics: async function (pool, blockNumber, extrinsics) {

    extrinsics.forEach(async (extrinsic, index) => {

      const signer = extrinsic.signer.toString();
      const section = extrinsic.toHuman().method.section;
      const method = extrinsic.toHuman().method.method;
      const args = JSON.stringify(extrinsic.args);
      const hash = extrinsic.hash.toHex();
      const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");

      // console.log(`Extrinsic: ${blockNumber}-${index} signer: ${signer} section: ${section} method: ${method} args: ${args} hash: ${hash} doc: ${doc}`);
      
      const sql = 
        `INSERT INTO extrinsic (
          block_number,
          extrinsic_index,
          signer,
          section,
          method,
          args,
          hash,
          doc
        ) VALUES (
          '${blockNumber}',
          '${index}',
          '${signer}',
          '${section}',
          '${method}',
          '${args}',
          '${hash}',
          '${doc}'
        )
        ON CONFLICT ON CONSTRAINT extrinsic_pkey 
        DO NOTHING;
        ;`;

      try {
        await pool.query(sql);
        console.log(`Adding extrinsic ${blockNumber}-${index}`);
        return true;
      } catch (error) {
        console.log(`Error adding extrinsic ${blockNumber}-${index}`);
        return false;
      }
    });
  }
};