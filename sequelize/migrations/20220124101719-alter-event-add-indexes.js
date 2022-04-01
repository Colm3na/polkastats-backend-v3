'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('event', ['method'], {
      name: 'event_method_idx'
    });

    await queryInterface.addIndex('event', ['section', 'method', 'phase'], {
      name: 'event_section_method_phase_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('event', 'event_method_idx')
    await queryInterface.removeIndex('event', 'event_section_method_phase_idx')
  }
};
