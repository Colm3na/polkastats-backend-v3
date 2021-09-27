import { Pool } from 'pg';
import { ApiPromise } from '@polkadot/api';
import { ILoggerOptions } from './../types/type';
import pino from 'pino'
import {  parseHexToString,
  bufferToString,
  updateTotals,
  genArrayRange,} from '../lib/utils'

const logger = pino()
const loggerOptions: ILoggerOptions = {
  crawler: "collectionListener"
}

async function getCollection(api: ApiPromise, collectionId: number): Promise<any> {
  const source = (await api.query.nft.collectionById(collectionId)).toJSON();
  let collection = null;
  if (source instanceof Object) {
    const { Owner, Name, Description, OffchainSchema, Limits } = source as any;
    collection = {
      collection_id: collectionId,
      owner: Owner,
      name: bufferToString(Name),
      description: bufferToString(Description),
      token_limit: Limits.TokenLimit,
      offchain_schema: parseHexToString(OffchainSchema),
    };
  }
  return collection;
}

async function getCollections(api: ApiPromise, countCollection: number): Promise<any[]> {
  const range = genArrayRange(1, countCollection);
  const collections = [];
  for (const item of range) {
    const collection = await getCollection(api, item);
    if (collection instanceof Object) {
      collections.push({ ...collection });
    }
  }
  return collections;
}

async function setExcaption(pool: Pool, error: any, collectionId: number): Promise<any> {
  logger.error(loggerOptions, `Error setting collection ${collectionId}`);
  try {
    const timestamp = new Date().getTime();
    const errorString = error.toString().replace(/'/g, "''");
    const sql = `INSERT INTO harvester_error (block_number, error, timestamp) VALUES ('${0}', '${errorString}', '${timestamp}');`;
    await pool.query(sql);
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error inserting error for collectionId #${collectionId} in harvester_error table :-/ : ${error}`
    );
  }
}

async function insertCollection(collection: any, pool: Pool): Promise<any> {
  const {collection_id, owner, name, description, token_limit, offchain_schema} = collection;

  const sql = `INSERT INTO collection (
    collection_id,
    owner,
    name,
    description,
    offchain_schema,
    token_limit    
  ) VALUES (
    '${collection_id}',
    '${owner}',
    '${name }',
    '${description}',     
    '${offchain_schema}',
    '${token_limit}'
  );`;  
  await pool.query(sql)
}

async function saveCollection(collection: any, pool: Pool): Promise<void> {
  const checkSQL = `SELECT collection_id FROM collection WHERE collection_id = ${collection.collection_id}`;
  const res = await pool.query(checkSQL);
  
  if (res.rows.length === 0) {
    await insertCollection(collection, pool)
    try {
    } catch (error) {
      await setExcaption(pool, error, collection.collection_id);
    }
  } else {
  }
}

async function getCollectionCount(api: ApiPromise): Promise<number> {
  const createdCollectionCount = (
    await api.query.nft.createdCollectionCount() as any).toNumber()
  return createdCollectionCount;
}

async function start (api: ApiPromise, pool: Pool, config: any): Promise<any> {
  logger.info(loggerOptions, "Starting collection crawler...");

  const countCollection = await getCollectionCount(api);
  const collections = await getCollections(api, countCollection);
  for (const item of collections) {
    await saveCollection(item, pool);
  }
  updateTotals(pool, loggerOptions)
}

export { start, insertCollection, getCollection, saveCollection, getCollectionCount, getCollections }