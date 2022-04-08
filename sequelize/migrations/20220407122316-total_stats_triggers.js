'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace function update_blocks_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
        update total set count = count + 1 where name = 'blocks';
        end if;

        if  (TG_OP = 'DELETE') then
        update total set count = count - 1 where name = 'blocks';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace trigger blocks_total after insert or delete on block
        FOR EACH row
        execute function update_blocks_total();
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace function update_extrinsics_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
        update total set count = count + 1 where name = 'extrinsics';
        end if;

        if  (TG_OP = 'DELETE') then
        update total set count = count - 1 where name = 'extrinsics';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace trigger extrinsic_total after insert or delete on extrinsic
        FOR EACH row
        execute function update_extrinsics_total();
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace function update_events_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
        update total set count = count + 1 where name = 'events';
        end if;

        if  (TG_OP = 'DELETE') then
        update total set count = count - 1 where name = 'events';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace trigger events_total after insert or delete on event
        FOR EACH row
        execute function update_events_total();
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE total SET count = (SELECT count(*) FROM collections) WHERE name ='collections';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace function update_collections_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
          update total set count = count + 1 where name = 'collections';
        end if;

        if  (TG_OP = 'DELETE') then
          update total set count = count - 1 where name = 'collections';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace trigger collections_total after insert or delete on collections
        FOR EACH row
        execute function update_collections_total();
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE total SET count = (SELECT count(*) FROM tokens) WHERE name ='tokens';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace function update_tokens_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT') then
          update total set count = count + 1 where name = 'tokens';
        end if;

        if  (TG_OP = 'DELETE') then
          update total set count = count - 1 where name = 'tokens';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace trigger tokens_total after insert or delete on tokens
        FOR EACH row
        execute function update_tokens_total();
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace function update_transfers_total() returns trigger as $$
        begin
        if  (TG_OP = 'INSERT' and new.section = 'balances' and new.method = 'transfer') then
          update total set count = count + 1 where name = 'transfers';
        end if;

        if  (TG_OP = 'DELETE' and old.section = 'balances' and old.method = 'transfer') then
          update total set count = count - 1 where name = 'transfers';
        end if;

        return null;
        end;
        $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        create or replace trigger transfers_total after insert or delete on extrinsic
        FOR EACH row
        execute function update_transfers_total();
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`drop trigger blocks_total on block;`);
    await queryInterface.sequelize.query(`drop function update_blocks_total;`);

    await queryInterface.sequelize.query(`drop trigger extrinsic_total on extrinsic;`);
    await queryInterface.sequelize.query(`drop function update_extrinsics_total;`);

    await queryInterface.sequelize.query(`drop trigger events_total on event;`);
    await queryInterface.sequelize.query(`drop function update_events_total;`);

    await queryInterface.sequelize.query(`drop trigger collections_total on collections;`);
    await queryInterface.sequelize.query(`drop function update_collections_total;`);

    await queryInterface.sequelize.query(`drop trigger tokens_total on tokens;`);
    await queryInterface.sequelize.query(`drop function update_tokens_total;`);

    await queryInterface.sequelize.query(`drop trigger transfers_total on extrinsic;`);
    await queryInterface.sequelize.query(`drop function update_transfers_total;`);
  },
};
