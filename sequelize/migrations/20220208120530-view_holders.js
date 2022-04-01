'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {      
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
      await queryInterface.sequelize.query('DROP VIEW view_holders;', transaction);      
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
};
