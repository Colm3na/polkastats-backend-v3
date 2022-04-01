'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.bulkInsert('total', [
        { name: 'blocks', count: 0 },
        { name: 'extrinsics', count: 0 },
        { name: 'transfers', count: 0 },
        { name: 'events', count: 0 },
        { name: 'collections', count: 0 },
        { name: 'tokens', count: 0 },
      ], 
      {
        transaction
      })
      
      await queryInterface.addIndex(
        'validator', ['account_id'],
        { name: 'validator_account_id_idx'}
      );
      
      await queryInterface.addIndex(
        'intention',
        ['account_id'],
        { name: 'intention_account_id_idx' }
      );

      await queryInterface.addIndex(
        'extrinsic',
        ['section'],
        { name: 'extrinsic_section_idx' }
      );      
      
      await queryInterface.addIndex(
        'extrinsic', ['method'],
        { name: 'extrinsic_method_idx' }
      );      

      await queryInterface.addIndex(
        'extrinsic', ['signer'],
        { name: 'extrinsic_signer_idx' }
      );      
      
      await queryInterface.addIndex(
        'extrinsic', ['args'],
        { name: 'extrinsic_args_idx' }
      ); 

      await queryInterface.changeColumn("account", "available_balance", {
        type: Sequelize.DataTypes.TEXT
      }, {
        transaction
      })


      await queryInterface.changeColumn("account", "nonce", {
        type: Sequelize.DataTypes.TEXT
      }, {
        transaction
      })

      await queryInterface.addColumn("event", "timestamp", {
        type: Sequelize.DataTypes.BIGINT, allowNull: false,
      }, {
        transaction
      })

      await queryInterface.createTable("tokens", {
        id: {
          type: Sequelize.DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          unique:true
        },
        token_id: {
          type: Sequelize.DataTypes.INTEGER,
          allowNull: false,
        },
        owner: {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
        },
        collection_id: {
          type: Sequelize.DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: {
              tableName: 'collections'
            },
            key: 'collection_id'
          }
        }
      },{
        transaction
      })
      
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }    
  },

  down: async (queryInterface, Sequelize) => {

     const transaction = await queryInterface.sequelize.transaction()

     try {
      await queryInterface.bulkDelete('total', null, {
        transaction
      })

      await queryInterface.removeIndex('validator', 'validator_account_id_idx', {
        transaction
      })
      await queryInterface.removeIndex('intention', 'intention_account_id_idx', {
        transaction
      })
      await queryInterface.removeIndex('extrinsic', ['extrinsic_section_idx', 'extrinsic_method_idx', 'extrinsic_signer_idx', 'extrinsic_args_idx'], {
        transaction
      })      

      await queryInterface.dropTable("tokens", {
        transaction
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
