'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('block', {
      block_number: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true
      },      
      block_number_finalized: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false 
      },
      block_author: Sequelize.DataTypes.TEXT,
      block_author_name: Sequelize.DataTypes.TEXT,
      block_hash: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      parent_hash: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      extrinsics_root: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      state_root: Sequelize.DataTypes.TEXT,
      current_era: Sequelize.DataTypes.BIGINT,
      current_index: Sequelize.DataTypes.BIGINT,
      era_length: Sequelize.DataTypes.BIGINT,
      era_progress: Sequelize.DataTypes.BIGINT,
      is_epoch: Sequelize.DataTypes.BOOLEAN,
      is_election: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false
      },       
      session_length: Sequelize.DataTypes.BIGINT,
      session_per_era: Sequelize.DataTypes.INTEGER,
      session_progress: Sequelize.DataTypes.BIGINT,
      validator_count: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },       
      spec_name: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      spec_version: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      total_events: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      num_transfers: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      new_accounts: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      total_issuance: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false
      }
   })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('block')
  }
};
