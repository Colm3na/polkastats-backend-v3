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
       await queryInterface.addColumn('extrinsic', 'timestamp', {
        type: Sequelize.DataTypes.BIGINT
       }, { transaction });
             
       await queryInterface.removeColumn('extrinsic', 'doc', { transaction });

       await queryInterface.addColumn('extrinsic', 'amount', {
        type: Sequelize.DataTypes.BIGINT,
        defaultValue: 0
       }, { transaction });

       await queryInterface.addColumn('event', 'amount', 
       {
        type: Sequelize.DataTypes.BIGINT,
        defaultValue: 0,        
       }, { transaction });

       await queryInterface.addColumn('extrinsic', 'fee', {
        type: Sequelize.DataTypes.BIGINT,
        defaultValue: 0
       }, { transaction });

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
