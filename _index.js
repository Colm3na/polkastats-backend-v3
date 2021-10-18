import { wsProviderUrl, dbConnect, crawlers } from "./config/config.js";
import { Sequelize } from "sequelize";
import { readFile } from "fs/promises";
import { Logger } from "./utils/logger.js";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { BlockExplorer } from "./lib/blockexplorer.js";

const log = new Logger();
const rtt = "./config/runtime_types.json";

async function getSequlize(sConnect) {
  const result = new Sequelize(sConnect);
  try {
    await result.authenticate();
    return result;
  } catch (error) {
    log.error(error);
  }
}

async function getRtt(rtt) {
  return JSON.parse(await readFile(new URL(rtt, import.meta.url)));
}

async function getPolkadotAPI(wsProviderUrl, rtt) {
  log.info(`Connecting to ${wsProviderUrl}`);
  const provider = new WsProvider(wsProviderUrl);
  const types = await getRtt(rtt);
  const api = await ApiPromise.create({ provider, types });

  api.on("error", async (value) => {
    log.error(value);
  });

  api.on("disconnected", async (value) => {
    log.error(value);
  });

  await api.isReady;

  log.info("API is ready!");

  // Wait for node is synced
  let node;
  try {
    node = await api.rpc.system.health();
  } catch {
    log.error({
      message: "Can't connect to node! Waiting 10s...",
      name: "disconnect",
    });
    api.disconnect();
    await wait(10000);
    return false;
  }

  log.info(`Node: ${JSON.stringify(node)}`);

  if (node && node.isSyncing.eq(false)) {
    // Node is synced!
    log.info("Node is synced!");    
    return api;
  } else {
    log.default("Node is not synced! Waiting 10s...");
    api.disconnect();
    await wait(10000);
  }
  return false;
}
/*const BackendV3 = require('./lib/BackendV3.js');*/

// 'postgres://user:pass@example.com:5432/dbname

async function main() {
  const sequelize = await getSequlize(dbConnect);
  const api = await getPolkadotAPI(wsProviderUrl, rtt);  
  const blockExplorer = new BlockExplorer({
    api, sequelize, crawlers
  });
  await blockExplorer.run()  
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
