GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;

CREATE TABLE IF NOT EXISTS block (  
  block_number BIGINT NOT NULL,
  block_number_finalized BIGINT NOT NULL,
  block_author TEXT NOT NULL,
  block_author_name TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsics_root TEXT NOT NULL,
  state_root TEXT NOT NULL,
  current_era BIGINT NOT NULL,
  current_index BIGINT NOT NULL,
  era_length BIGINT NOT NULL,
  era_progress BIGINT NOT NULL,
  is_epoch BOOLEAN NOT NULL,
  session_length BIGINT NOT NULL,
  session_per_era INT NOT NULL,
  session_progress BIGINT NOT NULL,
  validator_count INT NOT NULL,
  spec_name TEXT NOT NULL,
  spec_version INT NOT NULL,
  total_events INT NOT NULL,
  num_transfers INT NOT NULL,
  new_accounts INT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )  
);

CREATE TABLE IF NOT EXISTS validator  (
  block_height BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  stash_id TEXT NOT NULL,
  rank INT NOT NULL,
  stakers TEXT NOT NULL,
  identity TEXT NOT NULL,
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
  produced_blocks INT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height, session_index, account_id )
);

CREATE TABLE IF NOT EXISTS intention  (
  block_height BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  stash_id TEXT NOT NULL,
  rank INT NOT NULL,
  stakers TEXT NOT NULL,
  identity TEXT NOT NULL,
  display_name TEXT NOT NULL,
  nominators TEXT NOT NULL,
  reward_destination TEXT NOT NULL,
  staking_ledger TEXT NOT NULL,
  staking_ledger_total TEXT NOT NULL,
  validator_prefs TEXT NOT NULL,
  commission TEXT NOT NULL,
  next_session_ids TEXT NOT NULL,
  next_session_id_hex TEXT NOT NULL,
  next_elected TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height, session_index, account_id )
);

CREATE TABLE IF NOT EXISTS nominator  (
  block_height BIGINT NOT NULL,
  session_index INT NOT NULL,
  account_id TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  stash_id TEXT NOT NULL,
  rank INT NOT NULL,
  total_staked BIGINT NOT NULL,
  identity TEXT NOT NULL,
  display_name TEXT NOT NULL,
  balances TEXT NOT NULL,
  available_balance BIGINT NOT NULL,
  free_balance BIGINT NOT NULL,
  locked_balance BIGINT NOT NULL,
  nonce BIGINT NOT NULL,
  targets TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height, session_index, account_id )
);

CREATE TABLE IF NOT EXISTS event  (  
  block_number BIGINT NOT NULL,
  event_index INT NOT NULL,
  section TEXT NOT NULL,
  method TEXT NOT NULL,
  phase TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE IF NOT EXISTS extrinsic  (  
  block_number BIGINT NOT NULL,
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
  block_height BIGINT NOT NULL,
  phragmen_json TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS reward  (
  block_number BIGINT NOT NULL,
  era_index INT NOT NULL,
  stash_id TEXT,
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
  account_id TEXT,
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, era_index, account_id )  
);

CREATE TABLE IF NOT EXISTS nominator_slashes_era  (
  block_number BIGINT NOT NULL,
  era_index INT NOT NULL,
  account_id TEXT,
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number, era_index, account_id )  
);

CREATE TABLE IF NOT EXISTS account  (  
  account_id TEXT NOT NULL,
  identity TEXT NOT NULL,
  identity_display TEXT NOT NULL,
  identity_display_parent TEXT NOT NULL,
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
  chain TEXT NOT NULL,
  node_name TEXT NOT NULL,
  node_version TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS chain  (
  block_height BIGINT NOT NULL,
  session_index INT NOT NULL,
  total_issuance TEXT NOT NULL,
  active_accounts BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height )  
);


CREATE INDEX IF NOT EXISTS validator_account_id_idx ON validator (account_id);
CREATE INDEX IF NOT EXISTS intention_account_id_idx ON intention (account_id);

GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
GRANT ALL PRIVILEGES ON TABLE event TO polkastats;
GRANT ALL PRIVILEGES ON TABLE extrinsic TO polkastats;
GRANT ALL PRIVILEGES ON TABLE reward TO polkastats;
GRANT ALL PRIVILEGES ON TABLE account TO polkastats;
GRANT ALL PRIVILEGES ON TABLE phragmen TO polkastats;
GRANT ALL PRIVILEGES ON TABLE system TO polkastats;
GRANT ALL PRIVILEGES ON TABLE chain TO polkastats;

GRANT ALL PRIVILEGES ON TABLE validator TO polkastats;
GRANT ALL PRIVILEGES ON TABLE intention TO polkastats;