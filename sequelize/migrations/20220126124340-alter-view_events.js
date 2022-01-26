'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(`
        --beginsql
        UPDATE event
        SET
          block_index = event_with_data.block_index
        FROM (
          SELECT 
            block_number,
            event.phase::json ->> 'applyExtrinsic'::text as apply_extrinsic,
            concat(event.block_number, '-', event.phase::json ->> 'applyExtrinsic'::text) AS block_index
          FROM event
          WHERE block_index IS null and phase != 'Initialization' AND section = 'balances' AND method IN ('Transfer', 'Deposit')
        ) AS event_with_data
        WHERE event.block_index IS null and event.phase != 'Initialization' AND event.section = 'balances' AND event.method IN ('Transfer', 'Deposit') AND
        event.block_number = event_with_data.block_number AND event.phase::json ->> 'applyExtrinsic'::text = event_with_data.apply_extrinsic
        --endsql
      `, { transaction });

      await queryInterface.sequelize.query(`
        --beginsql
        CREATE OR REPLACE VIEW public.view_events AS
        SELECT
          block_index,
          block_number,
          sum(amount::double precision)::text AS amount,
          sum(fee::double precision)::text AS fee
        FROM 
        (
          SELECT
              event.block_index,
              event.block_number,
              CASE
                  WHEN event.method = 'Transfer'::text THEN event.amount
                  ELSE NULL::text
              END AS amount,
              CASE
                  WHEN event.method = 'Deposit'::text THEN event.amount
                  ELSE NULL::text
              END AS fee
            FROM event
            WHERE event.phase != 'Initialization' AND event.section = 'balances' AND event.method IN ('Transfer', 'Deposit')
        ) AS view_events
        GROUP BY block_index, block_number
        ORDER BY block_number DESC
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
      CREATE OR REPLACE VIEW view_events AS 
      SELECT
        CONCAT(event.block_number, '-', event.phase::json ->> 'applyExtrinsic'::text) AS block_index,
        event.block_number,
        CASE WHEN event.method = 'Transfer' THEN amount ELSE null END AS amount,
        CASE WHEN event.method = 'Deposit' THEN amount ELSE null END AS fee 
      FROM event
        WHERE phase != 'Initialization' AND section = 'balances' AND method IN ('Transfer', 'Deposit')
        ORDER BY event.block_number 
      --endsql
    `);
  },
};
