'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(`
        --beginsql
        UPDATE extrinsic
        SET
          block_index = extrinsic_with_data.block_index
        FROM (
          SELECT 
            block_number,
            extrinsic_index,
            concat(extrinsic.block_number, '-', extrinsic.extrinsic_index) AS block_index
          FROM extrinsic
          WHERE block_index IS NULL
        ) AS extrinsic_with_data
        WHERE extrinsic.block_number = extrinsic_with_data.block_number AND extrinsic.extrinsic_index = extrinsic_with_data.extrinsic_index
        --endsql
      `, { transaction });

      await queryInterface.sequelize.query(`
        --beginsql
        UPDATE extrinsic
        SET
          to_owner = extrinsic_with_data.to_owner
        FROM (
          SELECT 
            block_index,
            COALESCE((extrinsic.args::json -> 0) ->> 'id'::text, (extrinsic.args::json -> 0) ->> 'substrate'::text, (extrinsic.args::json -> 0) ->> 'ethereum'::text) AS to_owner
          FROM extrinsic
          WHERE method = ANY (ARRAY['transfer'::text, 'transferAll'::text, 'transferKeepAlive'::text, 'vestedTransfer'::text]) AND to_owner IS NULL
        ) AS extrinsic_with_data
        WHERE extrinsic.block_index = extrinsic_with_data.block_index
          --endsql
      `, { transaction });


    await queryInterface.sequelize.query(`
      --beginsql
      CREATE OR REPLACE VIEW public.view_events AS 
      select 
        extrinsic.block_index,
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
      LEFT JOIN view_events ev ON ev.block_index = extrinsic.block_index
      WHERE extrinsic.method in ('transfer', 'transferAll', 'transferKeepAlive', 'vestedTransfer')
      ORDER BY extrinsic.block_number
      --endsql
    `, { transaction });

      await transaction.commit();
    } catch (err) {
      console.log('err->', err);
      await transaction.rollback();
      throw err;
    }    
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      --beginsql
      create view view_extrinsic as 
        with view_extrinsic as (
        select
              concat(block_number,'-', extrinsic_index) as block_index,
              block_number,
              signer as from_owner,
              coalesce(
                (cast(args as json)::json->0)::json->>'id',
                (cast(args as json)::json->0)::json->>'substrate',
                (cast(args as json)::json->0)::json->>'ethereum'
              ) as to_owner,
              hash,
              success,
              timestamp,
              fee,
              method,
              section,
              amount from extrinsic
            where
            method in ('transfer', 'transferAll', 'transferKeepAlive', 'vestedTransfer')
        )
        select
        view_extrinsic.block_index,
        view_extrinsic.block_number,
        view_extrinsic.from_owner,
        view_extrinsic.to_owner,
        view_extrinsic.hash,
        view_extrinsic.success,
        view_extrinsic.timestamp,
        view_extrinsic.method,
        view_extrinsic.section,
        ev.amount as amount,
        ev.fee as fee
        from view_extrinsic
        left join view_events ev on ev.block_index = view_extrinsic.block_index;
          --endsql
    `);
  },
};
