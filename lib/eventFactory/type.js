module.exports = Object.freeze({
  TYPE_CREATE_COLLECTION: 'CollectionCreated',
  TYPE_COLLECTION_DESTROYED: 'CollectionDestroyed',
  TYPE_COLLECTION_SPONSOR_REMOVED: 'CollectionSponsorRemoved',
  TYPE_COLLECTION_ADMIN_ADDED: 'CollectionAdminAdded',
  TYPE_COLLECTION_OWNED_CHANGED: 'CollectionOwnedChanged',
  TYPE_SPONSORSHIP_CONFIRMED: 'SponsorshipConfirmed',
  TYPE_COLLECTION_ADMIN_REMOVED: 'CollectionAdminRemoved', //removeCollectionAdmin
  TYPE_ALLOWLISTADDRESS_REMOVED: 'AllowListAddressRemoved', //removeFromWhiteList
  TYPE_ALLOWLISTADDRESS_ADDED: 'AllowListAddressAdded', //addToWhiteList
  TYPE_COLLECTION_LIMIT_SET: 'CollectionLimitSet', // setCollectionLimits
  TYPE_COLLECTION_SPONSOR_SET: 'CollectionSponsorSet', //setCollectionSponsor
  TYPE_CONST_ON_CHAIN_SCHEMA_SET: 'ConstOnChainSchemaSet', //setConstOnChainSchema
  TYPE_MINT_PERMISSION_SET: 'MintPermissionSet', //setMintPermission
  TYPE_OFFCHAIN_SCHEMA_SET: 'OffchainSchemaSet', //setOffchainSchema
  TYPE_PUBLIC_ACCESS_MODE_SET: 'PublicAccessModeSet', //setPublicAccessMode
  TYPE_SCHEMA_VERSION_SET: 'SchemaVersionSet', //setSchemaVersion
  TYPE_VARIABLE_ONCHAIN_SCHEMA_SET: 'VariableOnChainSchemaSet', //setVariableOnChainSchema
  TYPE_CREATE_TOKEN: 'ItemCreated',
  TYPE_ITEM_DESTROYED: 'ItemDestroyed',
  TYPE_TRANSFER: 'Transfer',
})