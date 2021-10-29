'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     const transaction = await queryInterface.sequelize.transaction()

     try {
      
      await queryInterface.bulkInsert({ tableName: 'hdb_table', schema: 'hdb_catalog'},[
        { table_schema: 'public', table_name: 'account', is_system_defined: true },
        { table_schema: 'public', table_name: 'block', is_system_defined: true },
        { table_schema: 'public', table_name: 'collections', is_system_defined: true },
        { table_schema: 'public', table_name: 'event', is_system_defined: true },
        { table_schema: 'public', table_name: 'tokens', is_system_defined: true },
        { table_schema: 'public', table_name: 'system', is_system_defined: true },
        { table_schema: 'public', table_name: 'total', is_system_defined: true },
      ], {
        transaction
      })

          
      const data = {
         sources: [
          {
            kind: "postgres",
            name: "default",
            tables: [
              {
                table: { schema: 'public', name: 'account' }
              },
              {
                table: { schema: 'public', name: 'block' }
              },
              {
                table: { schema: 'public', name: 'collections' }
              },
              {
                table: { schema: 'public', name: 'event' }
              },
              {
                table: { schema: 'public', name: 'system' }
              },
              {
                table: { schema: 'public', name: 'total' }
              },
              {
                table: { schema: 'public', name: 'tokens' }
              }
            ],
            configuration: {
              connection_info: {
                use_prepared_statements: true,
                database_url: {
                  from_env: "HASURA_GRAPHQL_DATABASE_URL"
                },
                isolation_level: "read-committed",
                pool_settings: {
                  connection_lifetime: 600,
                  retries: 1,
                  idle_timeout: 180,
                  max_connections: 2
                }
              }
            }
          }
        ],
        version: 3
      };

      /*await queryInterface.bulkUpdate({ tableName: 'hdb_metadata', schema: 'hdb_catalog'}, 
        {
          metadata: data
        },
        {
          id: 1
        },
        { transaction })*/

       await transaction.commit();
     } catch (err) {
       await transaction.rollback();
       throw err
     }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
     try {
      await queryInterface.bulkDelete({ tableName: 'hdb_metadata', schema: 'hdb_catalog'}, null, {        
        transaction
      }) 
      await transaction.commit();
     } catch (err) {
      await transaction.rollback();
      throw err;
     }     
  }
};
