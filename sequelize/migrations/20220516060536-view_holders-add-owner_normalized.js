'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW public.view_holders
      AS SELECT
        t.collection_id,
        count(t.token_id) AS count,
        t.owner,
        t.owner_normalized
      FROM tokens t
      GROUP BY t.collection_id, t.owner, t.owner_normalized;
    `);
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_holders;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_holders
        AS SELECT t.collection_id,
          count(t.token_id) AS count,
          t.owner
        FROM tokens t
        GROUP BY t.collection_id, t.owner;
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
