import { IConfig } from './types/type';
import {
  substrateNetwork,
  wsProviderUrl,
  postgresConnParams,
  crawlers
} from './config/config'
import BackendV3 from './BackendV3'

async function main() {
  const config: IConfig = {
    substrateNetwork,
    wsProviderUrl,
    postgresConnParams,
    crawlers
  }
  const backendV3 = new BackendV3(config)
  backendV3.runCrawlers()
}

main().catch((error) => {
  console.error(error)
  process.exit(-1)
})