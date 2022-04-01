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
       
      await queryInterface.changeColumn('event', 'amount', 
      {
       type: Sequelize.DataTypes.TEXT,       
      }, { transaction });

      await queryInterface.changeColumn('extrinsic', 'fee', {
        type: Sequelize.DataTypes.TEXT      
      }, { transaction });

      await queryInterface.changeColumn('extrinsic', 'amount', {
        type: Sequelize.DataTypes.TEXT        
      }, { transaction });
    
      await transaction.commit();
     } catch (err) {
      await transaction.rollback();
      throw err;
     }
    //
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
