'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_extrinsic;', { transaction });
      await queryInterface.sequelize.query('DROP VIEW view_events;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_events
        AS SELECT view_events.block_index,
            view_events.block_number,
            sum(view_events.amount::double precision)::text AS amount,
            sum(view_events.fee::double precision)::text AS fee
          FROM ( SELECT event.block_index,
                    event.block_number,
                        CASE
                            WHEN event.method = 'Transfer'::text THEN event.amount
                            ELSE NULL::text
                        END AS amount,
                        CASE
                            WHEN event.method = 'Deposit'::text THEN event.amount
                            ELSE NULL::text
                        END AS fee
                  FROM event
                  WHERE event.phase <> 'Initialization'::text AND event.section = 'balances'::text AND (event.method = ANY (ARRAY['Transfer'::text, 'Deposit'::text]))) view_events
          GROUP BY view_events.block_index, view_events.block_number;
        `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_extrinsic
        AS SELECT extrinsic.block_index,
            extrinsic.block_number,
            extrinsic.signer AS from_owner,
            extrinsic.signer_normalized AS from_owner_normalized,
            extrinsic.to_owner,
            extrinsic.to_owner_normalized,
            extrinsic.hash,
            extrinsic.success,
            extrinsic."timestamp",
            extrinsic.method,
            extrinsic.section,
            ev.amount,
            ev.fee
          FROM extrinsic
            LEFT JOIN view_events ev ON ev.block_index = extrinsic.block_index::text
          WHERE extrinsic.method = ANY (ARRAY['transfer'::text, 'transferAll'::text, 'transferKeepAlive'::text, 'vestedTransfer'::text]);
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP VIEW view_extrinsic;', { transaction });
      await queryInterface.sequelize.query('DROP VIEW view_events;', { transaction });
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_events
        AS SELECT view_events.block_index,
            view_events.block_number,
            sum(view_events.amount::double precision)::text AS amount,
            sum(view_events.fee::double precision)::text AS fee
          FROM ( SELECT event.block_index,
                    event.block_number,
                        CASE
                            WHEN event.method = 'Transfer'::text THEN event.amount
                            ELSE NULL::text
                        END AS amount,
                        CASE
                            WHEN event.method = 'Deposit'::text THEN event.amount
                            ELSE NULL::text
                        END AS fee
                  FROM event
                  WHERE event.phase <> 'Initialization'::text AND event.section = 'balances'::text AND (event.method = ANY (ARRAY['Transfer'::text, 'Deposit'::text]))) view_events
          GROUP BY view_events.block_index, view_events.block_number
          ORDER BY view_events.block_number DESC;
        `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE VIEW public.view_extrinsic
        AS SELECT extrinsic.block_index,
            extrinsic.block_number,
            extrinsic.signer AS from_owner,
            extrinsic.signer_normalized AS from_owner_normalized,
            extrinsic.to_owner,
            extrinsic.to_owner_normalized,
            extrinsic.hash,
            extrinsic.success,
            extrinsic."timestamp",
            extrinsic.method,
            extrinsic.section,
            ev.amount,
            ev.fee
          FROM extrinsic
            LEFT JOIN view_events ev ON ev.block_index = extrinsic.block_index::text
          WHERE extrinsic.method = ANY (ARRAY['transfer'::text, 'transferAll'::text, 'transferKeepAlive'::text, 'vestedTransfer'::text])
          ORDER BY extrinsic.block_number;
        `,
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
};
