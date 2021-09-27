const { start } = require('./lib/crawlers/collectionListener')

const config = require('./backend.config.js');
const BackendV3 = require('./lib/BackendV3.js');

async function main () {
  const backendV3 = new BackendV3(config)
  const db = await backendV3.getPool()
  const api = await backendV3.getPolkadotAPI()
  start(api, db, {
    pollingTime: 20
  })
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});