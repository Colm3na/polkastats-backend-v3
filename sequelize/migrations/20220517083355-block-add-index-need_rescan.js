'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex('block', ['need_rescan'], {
      name: 'block_need_rescan_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('block', 'block_need_rescan_idx')
  },
};
