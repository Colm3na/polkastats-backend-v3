'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_collections;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_collections
        AS SELECT c.collection_id,
            c.owner,
            c.owner_normalized,
            c.name,
            c.description,
            c.offchain_schema,
            c.token_limit,
            c.token_prefix,
            c.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover,
            c.mode AS type,
            c.mint_mode,
            c.limits_account_ownership,
            c.limits_sponsore_data_size,
            c.limits_sponsore_data_rate,
            c.owner_can_transfer,
            c.owner_can_destroy,
            c.schema_version,
            c.sponsorship,
            c.const_chain_schema,
                CASE
                    WHEN COALESCE(cs.tokens_count, 0::bigint) > 0 THEN COALESCE(cs.tokens_count, 0::bigint)
                    ELSE 0::bigint
                END AS tokens_count,
                CASE
                    WHEN COALESCE(cs.holders_count, 0::bigint) > 0 THEN COALESCE(cs.holders_count, 0::bigint)
                    ELSE 0::bigint
                END AS holders_count,
                CASE
                    WHEN COALESCE(cs.actions_count, 0::bigint) > 0 THEN COALESCE(cs.actions_count, 0::bigint)
                    ELSE 0::bigint
                END AS actions_count,
            c.date_of_creation
          FROM collections c
            LEFT JOIN collections_stats cs ON cs.collection_id = c.collection_id;
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_collections;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_collections
        AS SELECT c.collection_id,
            c.owner,
            c.name,
            c.description,
            c.offchain_schema,
            c.token_limit,
            c.token_prefix,
            c.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover,
            c.mode AS type,
            c.mint_mode,
            c.limits_account_ownership,
            c.limits_sponsore_data_size,
            c.limits_sponsore_data_rate,
            c.owner_can_transfer,
            c.owner_can_destroy,
            c.schema_version,
            c.sponsorship,
            c.const_chain_schema,
                CASE
                    WHEN COALESCE(cs.tokens_count, 0::bigint) > 0 THEN COALESCE(cs.tokens_count, 0::bigint)
                    ELSE 0::bigint
                END AS tokens_count,
                CASE
                    WHEN COALESCE(cs.holders_count, 0::bigint) > 0 THEN COALESCE(cs.holders_count, 0::bigint)
                    ELSE 0::bigint
                END AS holders_count,
                CASE
                    WHEN COALESCE(cs.actions_count, 0::bigint) > 0 THEN COALESCE(cs.actions_count, 0::bigint)
                    ELSE 0::bigint
                END AS actions_count,
            c.date_of_creation
          FROM collections c
            LEFT JOIN collections_stats cs ON cs.collection_id = c.collection_id;
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
};
