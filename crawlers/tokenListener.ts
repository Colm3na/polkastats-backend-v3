import { BridgeAPI } from '../lib/providerAPI/bridgeApi';
import pino from 'pino';
import { ICrawlerModuleConstructorArgs } from '../config/config';
import { OpalAPI } from '../lib/providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from '../lib/providerAPI/bridgeProviderAPI/concreate/testnetAPI';
import { Sequelize } from 'sequelize/types';
import collectionDB from '../lib/collectionDB';
import { getProtoBufRoot } from '../utils/protobuf';
import tokenData from '../lib/tokenData';
import tokenDB from '../lib/tokenDB';

const logger = pino({ name: 'tokenListener' });

async function getCollections(sequelize: Sequelize): Promise<{ collectionId: number, schema: any }[]> {
  const collections = await collectionDB.get({
    selectList: ['collection_id', 'const_chain_schema'],
    sequelize,
  });
  return collections.map((collection) => ({
    collectionId: Number(collection.collection_id),
    schema: getProtoBufRoot(collection.const_chain_schema),
  }));
}

async function getCollectionTokens(
  bridgeAPI: OpalAPI | TestnetAPI,
  collection,
  maxTokenId: number,
) {
  const tokens = [];
  const destroyedTokens: number[] = [];

  for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
    try {
      const token = await tokenData.get({
        collection,
        tokenId,
        bridgeAPI,
      });

      tokens.push(token);
    } catch (e) {
      destroyedTokens.push(tokenId);
      logger.info(`Can't get token #${tokenId} in collection #${collection.collectionId}. Maybe it was burned.`);
    }
  }

  return {
    tokens,
    destroyedTokens,
  };
}

async function saveTokens(tokens: any[], sequelize: Sequelize): Promise<void> {
  for (const token of tokens) {
    await tokenDB.save({
      token,
      sequelize,
      excludeFields: ['date_of_creation'],
    });
  }
}

async function deleteTokens(
  collectionId: number,
  tokensIds: number[],
  sequelize: Sequelize,
) {
  for (const tokenId of tokensIds) {
    await tokenDB.del(tokenId, collectionId, sequelize);
  }
}

async function runTokensListener(bridgeAPI: OpalAPI | TestnetAPI, sequelize: Sequelize): Promise<void> {
  const collections = await getCollections(sequelize);
  for (const collection of collections) {
    const tokensCount = await bridgeAPI.getTokenCount(collection.collectionId);
    const { tokens, destroyedTokens } = await getCollectionTokens(bridgeAPI, collection, tokensCount);
    await deleteTokens(collection.collectionId, destroyedTokens, sequelize);
    await saveTokens(tokens, sequelize);

  }
}

export async function start({ api, sequelize, config }: ICrawlerModuleConstructorArgs) {
  const pollingTime = config.pollingTime;
  const bridgeAPI = (new BridgeAPI(api)).bridgeAPI;

  logger.info(`Starting token crawler with polling interval ${pollingTime / 1000} seconds...`);

  (async function run() {    
    await runTokensListener(bridgeAPI, sequelize);
    setTimeout(() => run(), pollingTime)
  })()
}
