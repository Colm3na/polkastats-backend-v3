'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_tokens;', transaction);
      await queryInterface.sequelize.query(`
        --beginsql
        create view view_tokens as
        select
        t.token_id, t.collection_id, t.data, t.owner,
               replace(
               coalesce(
                 c.offchain_schema,
                 ''
               ), '{id}', t.token_id::varchar(255)) image_path,
               c.token_prefix as token_prefix,
               c.name as collection_name,
               c.description as collection_description,
               c.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover
        from tokens t
        left join collections c on c.collection_id = t.collection_id
        --endsql
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

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_tokens;', transaction);
      await queryInterface.sequelize.query(`
        --beginsql
        create view view_tokens as select
        t.token_id, t.collection_id, t.data, t.owner,
               replace(
               coalesce(
                 c.offchain_schema,
                 ''
               ), '{id}', t.token_id::varchar(255)) image_path,
               c.token_prefix as token_prefix,
               c.name as collection_name
        from tokens t
        left join collections c on c.collection_id = t.collection_id
        --endsql
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
};
