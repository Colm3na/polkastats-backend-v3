"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    try {
      await queryInterface.createTable("hdb_table", {
        table_schema: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        table_name: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        is_system_defined: Sequelize.DataTypes.BOOLEAN,
      }, {
        schema: 'hdb_catalog'
      });
      
      await queryInterface.createTable("hdb_relationship", {
        table_schema: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        table_name: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        rel_name: {      
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,          
        },
        rel_type: Sequelize.DataTypes.TEXT,
        perm_def: Sequelize.DataTypes.JSONB,
        comment: Sequelize.DataTypes.TEXT,
        is_system_defined: Sequelize.DataTypes.BOOLEAN,
      }, {
        schema: 'hdb_catalog'
      });
      
      await queryInterface.createTable("hdb_permission", {
        table_schema: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        table_name: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        role_name: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        perm_type: {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
        },
        
        perm_def: {type: Sequelize.DataTypes.JSONB, allowNull: false},
        comment: Sequelize.DataTypes.TEXT,
        is_system_defined: Sequelize.DataTypes.BOOLEAN,
      },{
        schema: 'hdb_catalog'
      });          

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable("hdb_catalog.hdb_relationship");

     await queryInterface.dropTable("hdb_catalog.hdb_table");

     await queryInterface.dropTable("hdb_catalog.hdb_permission");
  },
};
