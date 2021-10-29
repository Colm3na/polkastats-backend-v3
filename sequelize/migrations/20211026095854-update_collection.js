'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      
      await queryInterface.addColumn('tokens', 'data', {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'const_chain_schema', {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {}        
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'variable_on_chain_schema', {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {}        
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'limits_accout_ownership', {
        type: Sequelize.DataTypes.BIGINT,        
      }, {
        transaction
      })
                
      await queryInterface.addColumn('collections', 'limits_sponsore_data_size', {
        type: Sequelize.DataTypes.INTEGER        
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'limits_sponsore_data_rate', {
        type: Sequelize.DataTypes.INTEGER        
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'owner_can_trasfer', {
        type: Sequelize.DataTypes.BOOLEAN
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'owner_can_destroy', {
        type: Sequelize.DataTypes.BOOLEAN
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'sponsorship_confirmed', {
        type: Sequelize.DataTypes.STRING
      }, {
        transaction
      })
      
      await queryInterface.addColumn('collections', 'schema_version', {
        type: Sequelize.DataTypes.STRING
      }, {
        transaction
      })

      await queryInterface.addColumn('collections', 'token_prefix', {
        type: Sequelize.DataTypes.STRING
      }, {
        transaction
      })

      await queryInterface.addColumn('collections', 'mode', {
        type: Sequelize.DataTypes.STRING
      }, {
        transaction
      })        

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {

      await queryInterface.removeColumn('tokens', 'data', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'const_chain_schema', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'variable_on_chain_schema', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'limits_accout_ownership', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'limits_sponsore_data_size', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'limits_sponsore_data_rate', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'owner_can_trasfer', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'owner_can_destroy', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'sponsorship_confirmed', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'schema_version', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'token_prefix', {
        transaction
      })
      
      await queryInterface.removeColumn('collections', 'mode', {
        transaction
      })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
};
