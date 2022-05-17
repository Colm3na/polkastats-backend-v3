'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex('extrinsic', ['timestamp'], {
      name: 'extrinsic_timestamp_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('extrinsic', 'extrinsic_timestamp_idx')
  },
};
