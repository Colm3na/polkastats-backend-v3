'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

async function getExtrinsicWithSigner(queryInterface, Sequelize, transaction) {
  const extrinsics = await queryInterface.sequelize.query(
    `
      select e.signer from extrinsic e
      where e.signer is not null and e.signer != '' and e.signer not like '5%' and length(e.signer) > 42
      group by e.signer
      limit 500;
    `,
    {
      type: Sequelize.QueryTypes.SELECT,
      logging: false,
      transaction,
    },
  );

  return extrinsics?.length > 0 ? extrinsics : null;
}

async function getExtrinsicWithToOwner(queryInterface, Sequelize, transaction) {
  const extrinsics = await queryInterface.sequelize.query(
    `
    select e.to_owner from extrinsic e 
    where e.to_owner is not null and e.to_owner != '' and e.to_owner not like '5%' and length(e.to_owner) > 42
    group by e.to_owner
    limit 500;
    `,
    {
      type: Sequelize.QueryTypes.SELECT,
      logging: false,
      transaction,
    },
  );

  return extrinsics?.length > 0 ? extrinsics : null;
}

function updateExtrinsicOwnerField(queryInterface, Sequelize, transaction, fieldName, address) {
  return queryInterface.sequelize.query(
    `update extrinsic set ${fieldName} = :normalizedAddress where ${fieldName} = :address`,
    {
      type: Sequelize.QueryTypes.UPDATE,
      logging: false,
      replacements: {
        address,
        normalizedAddress: normalizeSubstrateAddress(address),
      },
      transaction,
    },
  );
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    let extrinsicsWithSigner;
    let extrinsicsWithToOwner;

    try {
      while(extrinsicsWithSigner = await getExtrinsicWithSigner(queryInterface, Sequelize, transaction)) {
        for (const extrinsic of extrinsicsWithSigner) {
          await updateExtrinsicOwnerField(queryInterface, Sequelize, transaction, 'signer', extrinsic.signer);
        }
      }

      while(extrinsicsWithToOwner = await getExtrinsicWithToOwner(queryInterface, Sequelize, transaction)) {
        for (const extrinsic of extrinsicsWithToOwner) {
          await updateExtrinsicOwnerField(queryInterface, Sequelize, transaction, 'to_owner', extrinsic.to_owner);
        }
      }

      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {}
};
