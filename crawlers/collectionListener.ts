import { BridgeAPI } from '../lib/providerAPI/bridgeApi';
import { ICrawlerModuleConstructorArgs } from '../config/config';
import { OpalAPI } from 'lib/providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from 'lib/providerAPI/bridgeProviderAPI/concreate/testnetAPI';
import { Sequelize } from 'sequelize/types';
import pino from 'pino';
import collectionData from '../lib/collectionData';
import collectionDB from '../lib/collectionDB';

const logger = pino({ name: 'collectionListener' });

async function getCollections(bridgeAPI, maxCollectionId) {
  const collections = [];
  const destroyedCollections: number[] = [];
  for (let collectionId = 1; collectionId <= maxCollectionId; collectionId++) {
    const collection = await collectionData.get(collectionId, bridgeAPI);
    if (collection) {
      collections.push(collection);
    } else {
      destroyedCollections.push(collectionId);
    }
  }
  return {
    collections,
    destroyedCollections,
  };
}

async function saveCollections(collections: any[], sequelize: Sequelize) {
  for (const collection of collections) {
    logger.debug(`Save collection with id: ${collection?.collection_id}`);
    await collectionDB.save({
      collection,
      sequelize,
      excludeFields: ['date_of_creation'],
    });
  }
}

async function destroyCollections(collectionsIds: number[], sequelize: Sequelize) {
  for (const collectionId of collectionsIds) {
    logger.debug(`Remove collection with id: ${collectionId}`);
    await collectionDB.del(collectionId, sequelize);
  }
}

async function runCollectionsListener(bridgeAPI: OpalAPI | TestnetAPI, sequelize: Sequelize) {
  const collectionsCount = await bridgeAPI.getCollectionCount();
  const { collections, destroyedCollections } = await getCollections(bridgeAPI, collectionsCount);

  await saveCollections(collections, sequelize);
  await destroyCollections(destroyedCollections, sequelize);
  logger.info(`Total count: ${collectionsCount}. Exist: ${collections.length}. Burned: ${destroyedCollections.length}`);
}

export async function start({ api, sequelize, config }: ICrawlerModuleConstructorArgs) {
  const pollingTime = config.pollingTime;
  const bridgeAPI = (new BridgeAPI(api)).bridgeAPI;

  logger.info(`Starting collection crawler... Polling time are ${pollingTime / 1000} seconds.`);

  (async function run() {
    await runCollectionsListener(bridgeAPI, sequelize);
    setTimeout(() => run(), pollingTime);
  })();
}
