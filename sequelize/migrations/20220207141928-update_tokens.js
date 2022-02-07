'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {      
      await queryInterface.sequelize.query(`
      --beginsql
      update tokens t
    set date_of_creation = b.timestamp
from (
         select b.timestamp, events.collection_id, events.token_id
         from block b
                  inner join (
             select e.block_number,
                    (e.data::json -> 0)::text::int as collection_id,
                    (e.data::json -> 1)::text::int as token_id
             from event e
             where e.method = 'ItemCreated') as events on events.block_number = b.block_number
     ) as b
where  b.token_id = t.token_id and b.collection_id = t.collection_id;
      --endsql
      `, transaction);
      
      

      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();    
  },
};
