'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_collections;', transaction);
      await queryInterface.sequelize.query(`
        create or replace view public.view_collections
        as select
        c.collection_id,
        c.owner,
        c.name,
        c.description,
        c.offchain_schema,
        c.token_limit,
        c.token_prefix,
        c.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover,
        c."mode" as "type",
          c.mint_mode,
          c.limits_accout_ownership,
          c.limits_sponsore_data_size,
          c.limits_sponsore_data_rate,
          c.owner_can_trasfer,
          c.owner_can_destroy,
          c.schema_version,
          c.sponsorship_confirmed,
          c.const_chain_schema,
        coalesce(cs.tokens_count, 0) as tokens_count,
        coalesce(cs.holders_count, 0) as holders_count,
        coalesce(cs.actions_count, 0) as actions_count
        from collections c
        left join collections_stats cs on cs.collection_id = c.collection_id;
      `);
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
      await queryInterface.sequelize.query('DROP VIEW view_collections;', transaction);
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE VIEW public.view_collections
        AS SELECT collections.collection_id,
            collections.owner,
            collections.name,
            collections.description,
            collections.offchain_schema,
            collections.token_limit,
            collections.token_prefix,
            collections.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover
          FROM collections;
      `);
      await transaction.commit();
    } catch (err) {
      console.log('err->', err);
      await transaction.rollback();
      throw err;
    }
  },
};
