'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_tokens;', transaction);
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
               c.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover,
               t.date_of_creation
        from tokens t
        left join collections c on c.collection_id = t.collection_id
        --endsql
      `, {
        transaction
      });

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
          (case when coalesce(cs.tokens_count, 0) > 0 then coalesce(cs.tokens_count, 0)
            else 0
          end) as tokens_count,
        (case when coalesce(cs.holders_count, 0) > 0 then  coalesce(cs.holders_count, 0)
            else 0
        end) as holders_count,
       (case when coalesce(cs.actions_count, 0) > 0 then  coalesce(cs.actions_count, 0)
            else 0
        end) as actions_count
        from collections c
        left join collections_stats cs on cs.collection_id = c.collection_id;
      `);

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
      await queryInterface.sequelize.query('DROP VIEW view_tokens;', transaction);
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
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
};
