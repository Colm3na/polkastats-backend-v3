'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     const transaction = await queryInterface.sequelize.transaction()
     try {
      await queryInterface.sequelize.query(`
        create view view_events as 
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
      `, {
        transaction
      });
      
      await queryInterface.sequelize.query('drop view view_extrinsic', {
        transaction
      });

      await queryInterface.sequelize.query(`
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
       left join view_events ev on ev.block_index = view_extrinsic.block_index;`, {
        transaction
       });
      await transaction.commit();
     } catch (err) {
       console.log('err->', err);
       await transaction.rollback();
       throw err;
     }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     const transaction = await queryInterface.sequelize.transaction()
     await queryInterface.sequelize.query('drop view view_event_amount', {
      transaction
    });
  }
};
