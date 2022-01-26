'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('event', 'block_index', {
      type: Sequelize.DataTypes.TEXT,
    });

    await queryInterface.addIndex('event', ['block_index'], {
      name: 'event_block_index_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('event', 'event_block_index_idx')
    await queryInterface.removeColumn('event', 'block_index');
  },
};
