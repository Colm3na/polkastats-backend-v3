//
// PolkaStats backend v3
//
// This script run crawlers after sync is finoshed
//
// Usage: node block-sync-finished.js
//
//

// @ts-check
// Required imports
const { ApiPromise, WsProvider } = require("@polkadot/api");
// Import config params
const { wsProviderUrl } = require("../backend.config");

const crawlers = require("./crawlers");

async function main() {
  try {
    // Initialise the provider to connect to the local polkadot node
    const provider = new WsProvider(wsProviderUrl);

    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });

    const health = await api.rpc.system.health();

    if (health.isSyncing) {
      crawlers.runCrawlers();
      throw "Node is not synced. Waiting for a minute to try again.";
    } else {
      console.log("Node is synced. Running crawlers");
    }

    provider.disconnect();
  } catch (error) {
    console.error("Error: ", error);
    setTimeout(main, 50000);
  }
}

main();
