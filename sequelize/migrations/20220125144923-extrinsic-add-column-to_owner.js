'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('extrinsic', 'to_owner', {
      type: Sequelize.DataTypes.STRING,
    });

    await queryInterface.addIndex('extrinsic', ['to_owner'], {
      name: 'extrinsic_to_owner_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('extrinsic', 'extrinsic_to_owner_idx')
    await queryInterface.removeColumn('extrinsic', 'to_owner');
  }
};
