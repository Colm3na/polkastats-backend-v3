'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('extrinsic', 'block_index', {
      type: Sequelize.DataTypes.STRING,
    });

    await queryInterface.addIndex('extrinsic', ['block_index'], {
      name: 'extrinsic_block_index_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('extrinsic', 'extrinsic_block_index_idx')
    await queryInterface.removeColumn('extrinsic', 'block_index');
  },
};
