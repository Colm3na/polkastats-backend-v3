'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS view_tokens;', { transaction });
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS view_holders;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE "tokens" ALTER COLUMN "collection_id" TYPE bigint', { transaction });
      await queryInterface.sequelize.query(`
        --beginsql
        CREATE OR REPLACE VIEW public.view_tokens as
        select
        t.token_id, t.collection_id, t.data, t.owner,
                coalesce(
                        t.data::json->>'ipfsJson',
                        replace(coalesce(c.offchain_schema, ''), '{id}', t.token_id::varchar(255)),
                        ''
                    ) as image_path,
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
      await queryInterface.sequelize.query(`
        --beginsql
        CREATE OR REPLACE VIEW public.view_holders as
        select t.collection_id, count(t.token_id), t.owner
          from tokens t
          group by t.collection_id, t.owner
        --endsql
      `, {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS view_tokens;', { transaction });
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS view_holders;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE "tokens" ALTER COLUMN "collection_id" TYPE integer', { transaction });
      await queryInterface.sequelize.query(`
        --beginsql
        CREATE OR REPLACE VIEW public.view_tokens as
        select
        t.token_id, t.collection_id, t.data, t.owner,
                coalesce(
                        t.data::json->>'ipfsJson',
                        replace(coalesce(c.offchain_schema, ''), '{id}', t.token_id::varchar(255)),
                        ''
                    ) as image_path,
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
      await queryInterface.sequelize.query(`
        --beginsql
        CREATE OR REPLACE VIEW public.view_holders as
        select t.collection_id, count(t.token_id), t.owner
          from tokens t
          group by t.collection_id, t.owner
        --endsql
      `, {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  }
};
