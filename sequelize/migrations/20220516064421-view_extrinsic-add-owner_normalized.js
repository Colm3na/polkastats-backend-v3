'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_extrinsic;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_extrinsic
        AS SELECT extrinsic.block_index,
            extrinsic.block_number,
            extrinsic.signer AS from_owner,
            extrinsic.signer_normalized AS from_owner_normalized,
            extrinsic.to_owner,
            extrinsic.to_owner_normalized,
            extrinsic.hash,
            extrinsic.success,
            extrinsic."timestamp",
            extrinsic.method,
            extrinsic.section,
            ev.amount,
            ev.fee
          FROM extrinsic
            LEFT JOIN view_events ev ON ev.block_index = extrinsic.block_index::text
          WHERE extrinsic.method = ANY (ARRAY['transfer'::text, 'transferAll'::text, 'transferKeepAlive'::text, 'vestedTransfer'::text])
          ORDER BY extrinsic.block_number;
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_extrinsic;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_extrinsic
        AS SELECT extrinsic.block_index,
            extrinsic.block_number,
            extrinsic.signer AS from_owner,
            extrinsic.to_owner,
            extrinsic.hash,
            extrinsic.success,
            extrinsic."timestamp",
            extrinsic.method,
            extrinsic.section,
            ev.amount,
            ev.fee
          FROM extrinsic
            LEFT JOIN view_events ev ON ev.block_index = extrinsic.block_index::text
          WHERE extrinsic.method = ANY (ARRAY['transfer'::text, 'transferAll'::text, 'transferKeepAlive'::text, 'vestedTransfer'::text])
          ORDER BY extrinsic.block_number;
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
};
