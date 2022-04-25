'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.removeConstraint('tokens', 'tokens_collection_id_fkey');
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.addConstraint(
      'tokens',
      {
        name: 'tokens_collection_id_fkey',
        fields: ['collection_id'],
        type: 'foreign key',
        references: {
          table: 'collections',
          field: 'collection_id'
        },
      },
    );
  },
};
