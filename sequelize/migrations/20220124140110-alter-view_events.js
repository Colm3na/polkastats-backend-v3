'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
        CREATE OR REPLACE VIEW view_events AS 
        SELECT
          CONCAT(event.block_number, '-', event.phase::json ->> 'applyExtrinsic'::text) AS block_index,
          event.block_number,
          CASE WHEN event.method = 'Transfer' THEN amount ELSE null END AS amount,
          CASE WHEN event.method = 'Deposit' THEN amount ELSE null END AS fee 
        FROM event
          WHERE phase != 'Initialization' AND section = 'balances' AND method IN ('Transfer', 'Deposit')
          ORDER BY event.block_number 
        `
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
        create or replace view view_events as 
          with events as (
            select concat(
                          block_number,
                          '-',
                          cast(phase as json)::json ->> 'applyExtrinsic'
                      )
                      as block_index,
                  method,
                  block_number,
                  amount
            from event
            where phase != 'Initialization' and section = 'balances'
              and method in ('Transfer', 'Deposit')
            order by  block_number
        ), list_event_fee as (
            select block_index, block_number, amount as fee, method
            from events
            where method = 'Deposit'
        ), list_event_amount as (
            select block_index, block_number, amount, method
            from events
            where method = 'Transfer'
        )
        select
            ef.block_index, ef.block_number, amount, fee
            from list_event_amount as am
            right join list_event_fee as ef on ef.block_index = am.block_index;
      `);
  }
};
