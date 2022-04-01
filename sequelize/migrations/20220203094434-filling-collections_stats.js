'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      insert into collections_stats
      select
        c.collection_id,
        coalesce(tk.tokens_count, 0) as tokens_count,
        coalesce(tholders.holders_count, 0) as holders_count,
        coalesce(cevents.actions_count, 0) as actions_count
        FROM collections c
        left join (
          select
          t.collection_id as collection_id,
          count(t.id) as tokens_count
          from tokens t 
          group by t.collection_id 
        ) as tk on tk.collection_id = c.collection_id
        left join (
          select 
          taq.collection_id,
          count(taq.collection_id) as holders_count
          from (
            select 
            t.collection_id
            from tokens t
            group by t."owner", t.collection_id  
          ) as taq
          group by taq.collection_id
        ) as tholders on tholders.collection_id = c.collection_id 
        left join (
          select
          collection_id,
          count(collection_id) as actions_count
          from 
          (
            select
            (e.data::json->0)::text::int as collection_id
            from 
            event e
            where e.method in (
              'CollectionCreated',
              'CollectionDestroyed',
              'CollectionSponsorRemoved',
              'CollectionAdminAdded',
              'CollectionOwnedChanged',
              'SponsorshipConfirmed',
              'CollectionAdminRemoved',
              'AllowListAddressRemoved',
              'AllowListAddressAdded',
              'CollectionLimitSet',
              'CollectionSponsorSet',
              'ConstOnChainSchemaSet',
              'MintPermissionSet',
              'OffchainSchemaSet',
              'PublicAccessModeSet',
              'SchemaVersionSet',
              'VariableOnChainSchemaSet',
              'ItemCreated',
              'ItemDestroyed'
            ) 
          ) as ce
          group by ce.collection_id
          order by ce.collection_id
        ) as cevents on cevents.collection_id=c.collection_id
        order by c.collection_id desc
        ;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`delete from collections_stats;`);
  },
};
