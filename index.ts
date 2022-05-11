import { wait } from './utils/utils';
import { Sequelize } from 'sequelize';
import { wsProviderUrl, typeProvider, dbConnect, crawlers } from './config/config';
import { Logger } from './utils/logger';
import { BlockExplorer } from './blockexplorer';
import rtt from './config/runtime_types.json';
import { ProviderFactory } from './lib/providerAPI/providerAPI';
import { startServer } from './prometheus';

const log = new Logger();

async function getSequlize(sConnect) {
  const result = new Sequelize(
    sConnect,
    {
      logging: false,
      pool: {
        max: 30,
        min: 0,
        acquire: 120000,
        idle: 10000
      },
    },
  );
  try {
    await result.authenticate();
    return result;
  } catch (error) {
    log.error(error);
  }
}


async function getPolkadotAPI(wsProviderUrl, rtt) {
  log.info(`Connecting to ${wsProviderUrl}`);
  const provider = new ProviderFactory(wsProviderUrl, typeProvider);
  const api = await provider.getApi(rtt);


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
  } catch (e) {
    log.error({
      message: "Can't connect to node! Waiting 10s...",
      name: "disconnect",
      stack: e.stack,
    });
    api.disconnect();
    await wait(10000);
    throw e;
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
  return api;
}

async function main() {
  const sequelize = await getSequlize(dbConnect);
  const api = await getPolkadotAPI(wsProviderUrl, rtt);
  const blockExplorer = new BlockExplorer(api, sequelize, crawlers);
  await blockExplorer.run()

  startServer(() => {
    log.info('Server running...')
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
