'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(
        'account',
        'identity', {
        transaction
      });

      await queryInterface.removeColumn(
        'account',
        'identity_display',{
        transaction
      });

      await queryInterface.removeColumn(
        'account',
        'identity_display_parent', {
          transaction
        });      
    } catch (err) {
      await transaction.rollback()
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
    await queryInterface.addColumn('account', 'identity', Sequelize.DataTypes.TEXT);
    await queryInterface.addColumn('account', 'identity_display', Sequelize.DataTypes.TEXT);
    await queryInterface.addColumn('account', 'identity_display_parent', Sequelize.DataTypes.TEXT);
  }
};
