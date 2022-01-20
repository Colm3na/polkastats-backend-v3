'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.sequelize.query('drop view view_collections', transaction);
      await queryInterface.sequelize.query(`
        create view view_collections as select
          collection_id,
          owner,
          name,
          description,
          offchain_schema,
          token_limit,
          token_prefix,
          cast(variable_on_chain_schema as json)::json ->> 'collectionCover' as collection_cover
        from collections
      `, {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      console.log('err->', err);
      await transaction.rollback();
      throw err;
    }    
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.sequelize.query('drop view view_collections', transaction);
      await queryInterface.sequelize.query(`
        create view view_collections as select
          collection_id,
          owner,
          name,
          description,
          offchain_schema,
          token_limit,
          token_prefix 
        from collections
      `, {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      console.log('err->', err);
      await transaction.rollback();
      throw err;
    }    
  }
};
