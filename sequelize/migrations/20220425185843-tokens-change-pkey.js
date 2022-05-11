'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('tokens', 'tokens_pkey');
    await queryInterface.addConstraint(
      'tokens',
      {
        name: 'tokens_pkey',
        fields: ['collection_id', 'token_id'],
        type: 'primary key',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('tokens', 'tokens_pkey');
    await queryInterface.addConstraint(
      'tokens',
      {
        name: 'tokens_pkey',
        fields: ['id'],
        type: 'primary key',
      },
    );
  },
};
