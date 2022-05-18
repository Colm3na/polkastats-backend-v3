'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_tokens;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_tokens
        AS SELECT t.token_id,
            t.collection_id,
            t.data,
            t.owner,
            t.owner_normalized,
            t.owner != c.owner AS is_sold,
            COALESCE(t.data::json ->> 'ipfsJson'::text, replace(COALESCE(c.offchain_schema, ''::text), '{id}'::text, t.token_id::character varying(255)::text), ''::text) AS image_path,
            c.token_prefix,
            c.name AS collection_name,
            c.description AS collection_description,
            c.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover,
            c.owner AS collection_owner,
            c.owner_normalized AS collection_owner_normalized,
            t.date_of_creation
          FROM tokens t
            LEFT JOIN collections c ON c.collection_id = t.collection_id;
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
      await queryInterface.sequelize.query('DROP VIEW view_tokens;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_tokens
        AS SELECT t.token_id,
            t.collection_id,
            t.data,
            t.owner,
            COALESCE(t.data::json ->> 'ipfsJson'::text, replace(COALESCE(c.offchain_schema, ''::text), '{id}'::text, t.token_id::character varying(255)::text), ''::text) AS image_path,
            c.token_prefix,
            c.name AS collection_name,
            c.description AS collection_description,
            c.variable_on_chain_schema::json ->> 'collectionCover'::text AS collection_cover,
            t.date_of_creation
          FROM tokens t
            LEFT JOIN collections c ON c.collection_id = t.collection_id;
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  }
};
