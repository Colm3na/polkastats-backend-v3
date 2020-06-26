GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;

CREATE TABLE IF NOT EXISTS block (  
  block_number TEXT NOT NULL,
  block_number_finalized TEXT NOT NULL,
  block_author TEXT NOT NULL,
  block_author_name TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsics_root TEXT NOT NULL,
  state_root TEXT NOT NULL,
  current_era TEXT NOT NULL,
  current_index TEXT NOT NULL,
  era_length TEXT NOT NULL,
  era_progress TEXT NOT NULL,
  is_epoch BOOLEAN NOT NULL,
  session_length TEXT NOT NULL,
  session_per_era INT NOT NULL,
  session_progress TEXT NOT NULL,
  validator_count INT NOT NULL,
  spec_name TEXT NOT NULL,
  spec_version INT NOT NULL,
  total_events INT NOT NULL,
  num_transfers INT NOT NULL,
  new_accounts INT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number )  
);

CREATE TABLE IF NOT EXISTS event  (  
  block_number TEXT NOT NULL,
  event_index INT NOT NULL,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  phase TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE IF NOT EXISTS extrinsic  (  
  block_number TEXT NOT NULL,
  extrinsic_index INT NOT NULL,
  is_signed BOOLEAN NOT NULL,
  signer TEXT,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  args TEXT NOT NULL,
  hash TEXT NOT NULL,
  doc TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  PRIMARY KEY ( block_number, extrinsic_index ) 
);

CREATE TABLE IF NOT EXISTS phragmen  (  
  block_height TEXT NOT NULL,
  phragmen_json TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS rewards  (
  block_number TEXT NOT NULL,
  era_index INT NOT NULL,
  stash_id TEXT,
  commission TEXT,
  era_rewards TEXT,
  era_points INT NOT NULL,
  stake_info TEXT,
  estimated_payout TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( era_index, stash_id )  
);

CREATE TABLE IF NOT EXISTS validator_slashes_era  (
  block_number TEXT NOT NULL,
  era_index INT NOT NULL,
  account_id TEXT,
  amount TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, era_index, account_id )  
);

CREATE TABLE IF NOT EXISTS nominator_slashes_era  (
  block_number TEXT NOT NULL,
  era_index INT NOT NULL,
  account_id TEXT,
  amount TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, era_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_staking  (  
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  json TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index )  
);

CREATE TABLE IF NOT EXISTS intention_staking  (  
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  json TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index )  
);

CREATE TABLE IF NOT EXISTS validator_bonded  (
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,     
  amount TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_selfbonded  (
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,     
  amount TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_num_nominators  (
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,     
  nominators INT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_era_points  (
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,     
  era_points INT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_produced_blocks (
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,
  produced_blocks TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_active  (
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,     
  active BOOLEAN NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS intention_bonded  (
  block_number TEXT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,     
  amount TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS account  (  
  account_id TEXT NOT NULL,
  identity TEXT NOT NULL,
  identity_display TEXT NOT NULL,
  identity_display_parent TEXT NOT NULL,
  balances TEXT NOT NULL,
  available_balance TEXT NOT NULL,
  free_balance TEXT NOT NULL,
  locked_balance TEXT NOT NULL,
  nonce TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  block_height TEXT NOT NULL,
  is_staking BOOLEAN NOT NULL,
  PRIMARY KEY ( account_id )  
);

CREATE TABLE IF NOT EXISTS system  (
  block_height TEXT NOT NULL,
  chain TEXT NOT NULL,
  node_name TEXT NOT NULL,
  node_version TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS chain  (
  block_height TEXT NOT NULL,
  session_index INT NOT NULL,
  total_issuance TEXT NOT NULL,
  active_accounts TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  PRIMARY KEY ( block_height )  
);

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