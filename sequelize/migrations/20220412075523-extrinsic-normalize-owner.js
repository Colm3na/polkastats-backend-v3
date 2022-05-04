'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

async function normalizeAddress(
  queryInterface,
  Sequelize,
  transaction,
  srcField,
  dstField,
) {
  const selectQuery = `select distinct(${srcField}) from extrinsic where ${srcField} is not null and ${srcField} != '' and ${dstField} is null limit 1000`;
  const extrinsics = await queryInterface.sequelize.query(
    selectQuery,
    {
      type: Sequelize.QueryTypes.SELECT,
      logging: false,
      plain: false,
      transaction,
    },
  );

  if (extrinsics.length === 0) {
    return;
  }

  for (const extrinsic of extrinsics) {
    await queryInterface.sequelize.query(
      `update extrinsic set ${dstField} = :normalizedAddress where ${srcField} = :address`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        logging: false,
        replacements: {
          address: extrinsic[srcField],
          normalizedAddress: normalizeSubstrateAddress(extrinsic[srcField]),
        },
        transaction,
      },
    );
  }

  await normalizeAddress(queryInterface, Sequelize, transaction, srcField, dstField);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'extrinsic',
        'signer_normalized',
        {
          type: Sequelize.DataTypes.TEXT,
          allowNull: true,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'extrinsic',
        'to_owner_normalized',
        {
          type: Sequelize.DataTypes.TEXT,
          allowNull: true,
        },
        {
          transaction,
        },
      );

      await normalizeAddress(queryInterface, Sequelize, transaction, 'signer', 'signer_normalized');
      await normalizeAddress(queryInterface, Sequelize, transaction, 'to_owner', 'to_owner_normalized');

      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('extrinsic', 'signer_normalized');
    await queryInterface.removeColumn('extrinsic', 'to_owner_normalized');
  }
};
