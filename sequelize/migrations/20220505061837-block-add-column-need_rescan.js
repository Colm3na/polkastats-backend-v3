'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn('block', 'need_rescan', {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      }, {
        transaction,
      });

      await queryInterface.sequelize.query(`update block set need_rescan = true;`, { transaction });

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('block', 'need_rescan');
  },
};
