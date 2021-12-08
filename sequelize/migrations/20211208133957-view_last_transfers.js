'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`
    create view_last_transfers as
    with common as (
      select
          block_index,
          trim(both '"' from
              replace(
              replace(
              replace(split_part(data,',',3),
                  '{"substrate":', ''),
                  '{"ethereum":', ''),'}', '')
              ) as from_owner,
          trim(both '"' from
              replace(
              replace(
              replace(split_part(data,',',4),
                  '{"substrate":', ''),
                  '{"ethereum":', ''),'}', '')
              ) as to_owner
      from view_transfer where  method = 'Transfer' and section = 'common'
  ),
  balances as (
      select block_index,
             trim(both '"' from
                 trim(leading '[' from split_part(data,',', 1))
             ) as from_owner,
             trim(both '"' from split_part(data, ',', 2)) as to_owner
      from view_transfer where section = 'balances'
  ),
  list_nft_balance as (
      select block_index, from_owner, to_owner from balances
      union
      select block_index, from_owner, to_owner from common
  )
  select block_index, from_owner, to_owner
         from list_nft_balance order by  block_index;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query(`view_last_transfers`);
  }
};
