const { QueryTypes } = require("sequelize");

async function get({
  collectionId,
  selectList = [
    "collection_id",
    "name",
    "description",
    "offchain_schema",
    "token_limit, owner",
    "const_chain_schema",
    "variable_on_chain_schema",
    "limits_accout_ownership",
    "limits_sponsore_data_size",
    "limits_sponsore_data_rate",
    "owner_can_trasfer",
    "owner_can_destroy",
    "sponsorship_confirmed",
    "schema_version",
    "token_prefix",
    "mode",
  ],
  sequelize,
}) {
  function prepareCollection(collectionId) {
    const result = {
      where: "",
      query: {
        type: QueryTypes.SELECT,
        plain: false,
        logging: false,
        replacements: {
          collection_id: collectionId,
        },
      },
    };
    if (collectionId) {
      result.where = "WHERE collection_id = :collection_id";
      result.query.plain = true;
    }
    return result;
  }
  const prepare = prepareCollection(collectionId);

  const result = await sequelize.query(
    `SELECT ${selectList.join(",")} FROM collections ${prepare.where}`,
    {
      ...prepare.query,
    }
  );
  return result;
}

module.exports = Object.freeze({
  get,
});
