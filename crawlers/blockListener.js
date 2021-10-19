import Sequelize from "sequelize";
import pino from "pino";
import {
  shortHash,
  storeExtrinsics,
  storeLogs,
  getDisplayName,
  updateTotals,
} from "../utils/utils.js";
import { EventFacade } from "./eventFacade.js";

const logger = pino();
const { QueryTypes } = Sequelize;

const loggerOptions = {
  crawler: `blockListener`,
};

export async function start({api, sequelize, config}) {
  logger.info(loggerOptions, `Starting block listener...`);
  await api.rpc.chain.subscribeNewHeads(async (header) => {
    logger.info(`last block #${header.number} has hash ${header.hash}`);
    // Get block number
    const blockNumber = header.number.toNumber();
    // Get block hash
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

    // Parallelize
    const [
      //{ currentEra, currentIndex, eraLength, isEpoch, sessionsPerEra, validatorCount, eraProgress, sessionProgress },
      { block },
      blockNumberFinalized,
      extendedHeader,
      runtimeVersion,
      totalIssuance,
    ] = await Promise.all([
      //api.derive.session.progress(),
      api.rpc.chain.getBlock(blockHash),
      api.derive.chain.bestNumberFinalized(),
      api.derive.chain.getHeader(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
      api.query.balances.totalIssuance.at(blockHash),
    ]);

    // Get block parent hash
    const parentHash = header.parentHash;

    // Get block extrinsics root
    const extrinsicsRoot = header.extrinsicsRoot;

    // Get block state root

    // Get block author
    const blockAuthor = extendedHeader.author || null;

    // Get block author identity display name
    const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
    const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);

    // Get epoch duration
    const epochDuration = api.consts?.babe?.epochDuration || 0;

    let res = await sequelize.query(
      "SELECT block_number FROM block WHERE block_number = :blockNumber",
      {
        type: QueryTypes.SELECT,
        logging: false,
        replacements: {
          blockNumber,
        },
      }
    );
    // Handle chain reorganizations

    if (res.length > 0) {
      // Chain reorganization detected! We need to update block_author, block_hash and state_root
      logger.info(
        loggerOptions,
        `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`
      );

      // Get block author
      const blockAuthor = extendedHeader.author;

      // Get block author identity display name
      const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);

      await sequelize.query(
        `UPDATE block SET block_author = :block_author,
      block_author_name = :block_author_name,
      block_hash = :block_hash,
      state_root = :state_root WHERE block_number = :block_number`,
        {
          type: QueryTypes.UPDATE,
          logging: false,
          replacements: {
            block_author: blockAuthor,
            block_author_name: blockAuthorIdentity.identity.display || ``,
            block_hash: blockHash,
            state_root: header.stateRoot,
            block_number: blockNumber,
          },
        }
      );
    } else {
      // Get block events
      const blockEvents = await api.query.system.events.at(blockHash);

      // Get election status
      const eraElectionStatus =
        (await api.query?.staking?.eraElectionStatus()) || null;

      // Find number of balance transfers in this block
      const numTransfers =
        blockEvents.filter(
          (record) =>
            record.event.section === `balances` &&
            record.event.method === `Transfer`
        ).length || 0;

      // Find number of new accounts in this block
      const newAccounts =
        blockEvents.filter(
          (record) =>
            record.event.section === `balances` &&
            record.event.method === `Endowed`
        ).length || 0;

      // Store new block
      logger.info(
        loggerOptions,
        `Adding block #${blockNumber} (${shortHash(blockHash.toString())})`
      );

      const timestampMs = await api.query.timestamp.now.at(blockHash);

      await sequelize.query(
        `INSERT INTO block (block_number, block_number_finalized, block_author, block_author_name,
          block_hash, parent_hash, extrinsics_root, state_root, current_era, current_index,
          era_length, era_progress, is_epoch, is_election, session_length, session_per_era,
          session_progress, validator_count, spec_name, spec_version, total_events,
          num_transfers, new_accounts, total_issuance, timestamp
        ) VALUES (
          :block_number, :block_number_finalized, :block_author, :block_author_name,
          :block_hash, :parent_hash, :extrinsics_root, :state_root, :current_era,
          :current_index, :era_length, :era_progress, :is_epoch, :is_election,
          :session_length, :session_per_era, :session_progress, :validator_count,
          :spec_name, :spec_version, :total_events, :num_transfers, :new_accounts,
          :total_issuance, :timestamp
        )
        ON CONFLICT ON CONSTRAINT block_pkey
        DO NOTHING;`,
        {
          type: QueryTypes.INSERT,
          logging: false,
          replacements: {
            block_number: blockNumber,
            block_number_finalized: blockNumberFinalized.toString(),
            block_author: blockAuthor,
            block_author_name: getDisplayName(blockAuthorIdentity.identity),
            block_hash: blockHash.toString(),
            parent_hash: header.parentHash.toString(),
            extrinsics_root: header.extrinsicsRoot.toString(),
            state_root: header.stateRoot.toString(),
            current_era: 0,
            current_index: 0,
            era_length: 0,
            era_progress: 0,
            is_epoch: false,
            is_election:
              eraElectionStatus?.toString() === `Close` ? false : true,
            session_length: (api.consts?.babe?.epochDuration || 0).toString(),
            session_per_era: 0,
            session_progress: 0,
            validator_count: 0,
            spec_name: runtimeVersion.specName.toString(),
            spec_version: runtimeVersion.specVersion.toString(),
            total_events: blockEvents.length || 0,
            num_transfers: numTransfers,
            new_accounts: newAccounts,
            total_issuance: totalIssuance.toString(),
            timestamp: Math.floor(timestampMs / 1000),
          },
        }
      );

      // Store block extrinsics
      await storeExtrinsics(
        sequelize,
        blockNumber,
        block.extrinsics,
        blockEvents,
        loggerOptions
      );

      const eventFacade = new EventFacade(api, sequelize);
      // Loop through the Vec<EventRecord>
      await blockEvents.forEach(async (record, index) => {
        //console.log('record->', record);
        // Extract the phase and event
        const { event, phase } = record;

        const res = await sequelize.query(
          "SELECT FROM event WHERE block_number = :blockNumber AND event_index = :index",
          {
            type: QueryTypes.SELECT,
            logging: false,
            plain: true,
            replacements: {
              blockNumber,
              index,
            },
          }
        );
        
        if (!res && event.section !== "system" && event.method !== 'ExtrinsicSuccess') {
          await sequelize.query(
            `INSERT INTO event (block_number,event_index, section, method, phase, data)
            VALUES (:block_number,:event_index, :section, :method, :phase, :data);`,
            {
              type: QueryTypes.INSERT,
              logging: false,
              replacements: {
                block_number: blockNumber,
                event_index: index,
                section: event.section,
                method: event.method,
                phase: phase.toString(),
                data: JSON.stringify(event.data),
              },
            }
          );
          logger.info(
            loggerOptions,
            `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`
          );
          eventFacade.save(event.method, event.data.toJSON());
        }
      });
    }
    updateTotals(sequelize, loggerOptions);
  });
}