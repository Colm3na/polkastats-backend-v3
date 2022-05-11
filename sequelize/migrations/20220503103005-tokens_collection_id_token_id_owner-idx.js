'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex(
      'tokens',
      ['collection_id', 'token_id', 'owner'],
      {
        name: 'tokens_collection_id_token_id_owner_idx',
      },
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('tokens', 'tokens_collection_id_token_id_owner_idx');
  }
};
