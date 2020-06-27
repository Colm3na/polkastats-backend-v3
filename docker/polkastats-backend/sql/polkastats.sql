GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;

CREATE TABLE IF NOT EXISTS block (  
  block_number BIGINT NOT NULL,
  block_number_finalized BIGINT NOT NULL,
  block_author VARCHAR(50) NOT NULL,
  block_author_name VARCHAR(100) NOT NULL,
  block_hash VARCHAR(66) NOT NULL,
  parent_hash VARCHAR(66) NOT NULL,
  extrinsics_root VARCHAR(66) NOT NULL,
  state_root VARCHAR(66) NOT NULL,
  current_era BIGINT NOT NULL,
  current_index BIGINT NOT NULL,
  era_length BIGINT NOT NULL,
  era_progress BIGINT NOT NULL,
  is_epoch BOOLEAN NOT NULL,
  session_length BIGINT NOT NULL,
  session_per_era INT NOT NULL,
  session_progress BIGINT NOT NULL,
  validator_count INT NOT NULL,
  spec_name VARCHAR(100) NOT NULL,
  spec_version INT NOT NULL,
  total_events INT NOT NULL,
  num_transfers INT NOT NULL,
  new_accounts INT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )  
);

CREATE TABLE IF NOT EXISTS event  (  
  block_number BIGINT NOT NULL,
  event_index INT NOT NULL,
  section VARCHAR(100) NOT NULL,
  method VARCHAR(100) NOT NULL,
  phase VARCHAR(100) NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE IF NOT EXISTS extrinsic  (  
  block_number BIGINT NOT NULL,
  extrinsic_index INT NOT NULL,
  is_signed BOOLEAN NOT NULL,
  signer VARCHAR(50),
  section VARCHAR(100) NOT NULL,
  method VARCHAR(100) NOT NULL,
  args TEXT NOT NULL,
  hash VARCHAR(100) NOT NULL,
  doc TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  PRIMARY KEY ( block_number, extrinsic_index ) 
);

CREATE TABLE IF NOT EXISTS phragmen  (  
  block_height BIGINT NOT NULL,
  phragmen_json TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS rewards  (
  block_number BIGINT NOT NULL,
  era_index INT NOT NULL,
  stash_id VARCHAR(50),
  commission BIGINT,
  era_rewards TEXT,
  era_points INT NOT NULL,
  stake_info TEXT,
  estimated_payout BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( era_index, stash_id )  
);

CREATE TABLE IF NOT EXISTS validator_slashes_era  (
  block_number BIGINT NOT NULL,
  era_index INT NOT NULL,
  account_id VARCHAR(50),
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, era_index, account_id )  
);

CREATE TABLE IF NOT EXISTS nominator_slashes_era  (
  block_number BIGINT NOT NULL,
  era_index INT NOT NULL,
  account_id VARCHAR(50),
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, era_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_staking  (  
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  json TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index )  
);

CREATE TABLE IF NOT EXISTS intention_staking  (  
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  json TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index )  
);

CREATE TABLE IF NOT EXISTS validator_bonded  (
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id VARCHAR(50) NOT NULL,     
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_selfbonded  (
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id VARCHAR(50) NOT NULL,     
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_num_nominators  (
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id VARCHAR(50) NOT NULL,     
  nominators INT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_era_points  (
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id VARCHAR(50) NOT NULL,     
  era_points INT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_produced_blocks (
  session_index INT NOT NULL,
  account_id VARCHAR(50) NOT NULL,
  produced_blocks BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_active  (
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id VARCHAR(50) NOT NULL,     
  active BOOLEAN NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS intention_bonded  (
  block_number BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id VARCHAR(50) NOT NULL,     
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS account  (  
  account_id VARCHAR(50) NOT NULL,
  identity TEXT NOT NULL,
  identity_display VARCHAR(100) NOT NULL,
  identity_display_parent VARCHAR(100) NOT NULL,
  balances TEXT NOT NULL,
  available_balance BIGINT NOT NULL,
  free_balance BIGINT NOT NULL,
  locked_balance BIGINT NOT NULL,
  nonce BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  block_height BIGINT NOT NULL,
  is_staking BOOLEAN NOT NULL,
  PRIMARY KEY ( account_id )  
);

CREATE TABLE IF NOT EXISTS system  (
  block_height BIGINT NOT NULL,
  chain VARCHAR(100) NOT NULL,
  node_name VARCHAR(100) NOT NULL,
  node_version VARCHAR(100) NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS chain  (
  block_height BIGINT NOT NULL,
  session_index INT NOT NULL,
  total_issuance VARCHAR(100) NOT NULL,
  active_accounts BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height )  
);

-- New validator and intention tables

CREATE TABLE IF NOT EXISTS validator  (
  block_height BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  stash_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  exposure TEXT NOT NULL,
  exposure_total TEXT NOT NULL,
  exposure_own TEXT NOT NULL,
  exposure_others TEXT NOT NULL,
  nominators TEXT NOT NULL,
  reward_destination TEXT NOT NULL,
  staking_ledger TEXT NOT NULL,
  validator_prefs TEXT NOT NULL,
  commission TEXT NOT NULL,
  session_ids TEXT NOT NULL,
  next_session_ids TEXT NOT NULL,
  session_id_hex TEXT NOT NULL,
  next_session_id_hex TEXT NOT NULL,
  redeemable TEXT NOT NULL,
  im_online TEXT NOT NULL,
  current_elected TEXT NOT NULL,
  next_elected TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height, session_index, account_id )
);

CREATE TABLE IF NOT EXISTS intention  (
  block_height BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  stash_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  exposure TEXT NOT NULL,
  exposure_total TEXT NOT NULL,
  exposure_own TEXT NOT NULL,
  exposure_others TEXT NOT NULL,
  nominators TEXT NOT NULL,
  reward_destination TEXT NOT NULL,
  staking_ledger TEXT NOT NULL,
  validator_prefs TEXT NOT NULL,
  commission TEXT NOT NULL,
  session_ids TEXT NOT NULL,
  next_session_ids TEXT NOT NULL,
  session_id_hex TEXT NOT NULL,
  next_session_id_hex TEXT NOT NULL,
  redeemable TEXT NOT NULL,
  im_online TEXT NOT NULL,
  current_elected TEXT NOT NULL,
  next_elected TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height, session_index, account_id )
);

CREATE INDEX IF NOT EXISTS validator_account_id_idx ON validator (account_id);
CREATE INDEX IF NOT EXISTS intention_account_id_idx ON intention (account_id);

CREATE INDEX IF NOT EXISTS validator_bonded_account_id_idx ON validator_bonded (account_id);
CREATE INDEX IF NOT EXISTS validator_selfbonded_account_id_idx ON validator_selfbonded (account_id);
CREATE INDEX IF NOT EXISTS validator_num_nominators_account_id_idx ON validator_num_nominators (account_id);
CREATE INDEX IF NOT EXISTS validator_era_points_account_id_idx ON validator_era_points (account_id);
CREATE INDEX IF NOT EXISTS validator_active_account_id_idx ON validator_active (account_id);
CREATE INDEX IF NOT EXISTS validator_produced_blocks_id_idx ON validator_produced_blocks (account_id);

GRANT ALL PRIVILEGES ON TABLE validator_staking TO polkastats;
GRANT ALL PRIVILEGES ON TABLE intention_staking TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_bonded TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_selfbonded TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_num_nominators TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_era_points TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_active TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_produced_blocks TO polkastats;
GRANT ALL PRIVILEGES ON TABLE intention_bonded TO polkastats;
GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
GRANT ALL PRIVILEGES ON TABLE event TO polkastats;
GRANT ALL PRIVILEGES ON TABLE extrinsic TO polkastats;
GRANT ALL PRIVILEGES ON TABLE rewards TO polkastats;
GRANT ALL PRIVILEGES ON TABLE account TO polkastats;
GRANT ALL PRIVILEGES ON TABLE phragmen TO polkastats;
GRANT ALL PRIVILEGES ON TABLE system TO polkastats;
GRANT ALL PRIVILEGES ON TABLE chain TO polkastats;

GRANT ALL PRIVILEGES ON TABLE validator TO polkastats;
GRANT ALL PRIVILEGES ON TABLE intention TO polkastats;