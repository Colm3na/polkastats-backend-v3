'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    
    try {
      await queryInterface.addColumn('extrinsic', 'block_index', {
        type: Sequelize.DataTypes.STRING,
      });

      await queryInterface.addIndex('extrinsic', ['block_index'], {
        name: 'extrinsic_block_index_idx'
      });

      await transaction.commit();
    } catch (err) {
      console.log('err->', err);
      await transaction.rollback();
      throw err;
    }    
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('extrinsic', 'extrinsic_block_index_idx')
    await queryInterface.removeColumn('extrinsic', 'block_index');
  },
};
