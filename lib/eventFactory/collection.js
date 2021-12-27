const { CollectionAdminAdded } = require("./collection/addColectionAdmin.js");
const { AddToWhiteList } = require("./collection/addToWhiteList.js");
const { CollectionOwnedChanged } = require("./collection/changeCollectionOwner.js");
const { ConfirmSponsorship } = require("./collection/confirmSponsorship.js");
const { CreateCollection } = require("./collection/createCollection.js");
const { DestoyCollection } = require("./collection/destroyCollection.js");
const { RemoveCollectionAdmin } = require("./collection/removeCollectionAdmin.js");
const { RemoveCollectionSponsor } = require("./collection/removeCollectionSponsor.js");
const { RemoveFromWhiteList } = require("./collection/removeFromWhiteList.js");
const { SetCollectionLimits } = require("./collection/setCollectionLimits.js");
const { SetCollectionSponsor } = require("./collection/setCollectionSponsor.js");
const { SetConstOnChainSchema } = require("./collection/setConstOnChainSchema.js");
const { SetMintPermission } = require("./collection/setMintPermission.js");
const { SetOffchainSchema } = require("./collection/setOffchainSchema.js");
const { SetPublicAccessMode } = require("./collection/setPublicAccessMode.js");
const { SetSchemaVersion } = require("./collection/setSchemaVersion.js");
const { SetVariableOnChainSchema } = require("./collection/setVariableOnChainSchema.js");

module.exports = Object.freeze({
  create: CreateCollection,
  destroyed: DestoyCollection,  
  removeSponsor: RemoveCollectionSponsor,
  addAdmin: CollectionAdminAdded,
  changeOwner: CollectionOwnedChanged,
  confirmSponsorship: ConfirmSponsorship,
  removeAdmin: RemoveCollectionAdmin,  
  removeFromWhiteList: RemoveFromWhiteList,
  setLimits: SetCollectionLimits,
  setSponsor: SetCollectionSponsor,
  setConstSchema: SetConstOnChainSchema,
  setMintPermission: SetMintPermission,
  setOffchainSchema: SetOffchainSchema,
  setSchemaVersion: SetSchemaVersion,
  setVariableSchema: SetVariableOnChainSchema,
  setPublicMode: SetPublicAccessMode,
  addToWhiteList: AddToWhiteList
})