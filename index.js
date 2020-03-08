
const config = require('backend.config.js');
const BackendV3 = require('lib/BackendV3.js');

async function main () {
  const backendV3 = new BackendV3(config); 
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});