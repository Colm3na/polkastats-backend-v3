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
      await queryInterface.removeColumn('event', 'timestamp', 
      {
        transaction
      });

      await queryInterface.addColumn('event', 'timestamp', {
        type: Sequelize.DataTypes.BIGINT
      }, {
        transaction
      });

      await queryInterface.sequelize.query(`
      create view view_extrinsic as
      select concat(block_number,'-', extrinsic_index) as block_index, 
      block_number,
      signer, hash, args, section, method, success,
      0 as timestamp,
      0 as fee,
      0 as amount
      from extrinsic
    `);

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
