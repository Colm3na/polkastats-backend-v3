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
      await queryInterface.sequelize.query('drop view view_extrinsic', {
        transaction
      });
      
      await queryInterface.sequelize.query(`
      create view view_extrinsic as 
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
    method in ('transfer', 'transferAll', 'transferKeepAlive', 'vestedTransfer')`, {
        transaction
      });
      await transaction.commit();
     } catch (err) {
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
  }
};
