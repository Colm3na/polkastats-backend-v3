GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;

CREATE TABLE IF NOT EXISTS block (  
  block_number BIGINT NOT NULL,
  block_number_finalized BIGINT NOT NULL,
  block_author TEXT,
  block_author_name TEXT,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  extrinsics_root TEXT NOT NULL,
  state_root TEXT,
  current_era BIGINT,
  current_index BIGINT,
  era_length BIGINT,
  era_progress BIGINT,
  is_epoch BOOLEAN,
  is_election BOOLEAN NOT NULL,
  session_length BIGINT,
  session_per_era INT,
  session_progress BIGINT,
  validator_count INT NOT NULL,
  spec_name TEXT NOT NULL,
  spec_version INT NOT NULL,
  total_events INT NOT NULL,
  num_transfers INT NOT NULL,
  new_accounts INT NOT NULL,
  total_issuance TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_number )  
);

CREATE TABLE IF NOT EXISTS harvester_error (  
  block_number BIGINT NOT NULL,
  error TEXT NOT NULL,
  timestamp BIGINT NOT NULL
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
  next_elected BOOLEAN NOT NULL,
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
  next_elected BOOLEAN NOT NULL,
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

CREATE TABLE IF NOT EXISTS log  (  
  block_number BIGINT NOT NULL,
  log_index INT NOT NULL,
  type TEXT,
  engine TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY ( block_number, log_index ) 
);

CREATE TABLE IF NOT EXISTS phragmen  (  
  block_height BIGINT NOT NULL,
  phragmen_json TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS validator_era_staking  (
  era_index INT NOT NULL,
  stash_id TEXT,
  identity TEXT NOT NULL,
  display_name TEXT NOT NULL,
  commission BIGINT,
  era_rewards TEXT,
  era_points INT NOT NULL,
  stake_info TEXT,
  estimated_payout BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( era_index, stash_id )  
);

CREATE TABLE IF NOT EXISTS validator_era_slash  (
  era_index INT NOT NULL,
  stash_id TEXT,
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( era_index, stash_id )  
);

CREATE TABLE IF NOT EXISTS nominator_era_slash  (
  era_index INT NOT NULL,
  stash_id TEXT,
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  PRIMARY KEY ( era_index, stash_id )  
);

CREATE TABLE IF NOT EXISTS account  (  
  account_id TEXT NOT NULL,
  identity TEXT NOT NULL,
  identity_display TEXT NOT NULL,
  identity_display_parent TEXT NOT NULL,
  balances TEXT NOT NULL,
  available_balance BIGINT NOT NULL,
  free_balance TEXT NOT NULL,
  locked_balance TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS collection (
  collection_id INT NOT NULL,
  owner TEXT NOT NULL,
  name TEXT,
  description TEXT,
  offchain_schema TEXT,
  token_limit BIGINT NOT NULL,
  PRIMARY KEY (collection_id)
);

CREATE TABLE IF NOT EXISTS total (  
  name TEXT,
  count BIGINT NOT NULL,
  PRIMARY KEY ( name )
);

INSERT INTO total (name, count) VALUES 
('blocks', 0),
('extrinsics', 0),
('transfers', 0),
('events', 0),
('collection', 0),
('token', 0);

CREATE INDEX IF NOT EXISTS validator_account_id_idx ON validator (account_id);
CREATE INDEX IF NOT EXISTS intention_account_id_idx ON intention (account_id);

CREATE INDEX IF NOT EXISTS extrinsic_section_idx ON extrinsic (section);
CREATE INDEX IF NOT EXISTS extrinsic_method_idx ON extrinsic (method);
CREATE INDEX IF NOT EXISTS extrinsic_signer_idx ON extrinsic (signer);
CREATE INDEX IF NOT EXISTS extrinsic_args_idx ON extrinsic (args);

GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
GRANT ALL PRIVILEGES ON TABLE harvester_error TO polkastats;
GRANT ALL PRIVILEGES ON TABLE event TO polkastats;
GRANT ALL PRIVILEGES ON TABLE extrinsic TO polkastats;
GRANT ALL PRIVILEGES ON TABLE log TO polkastats;
GRANT ALL PRIVILEGES ON TABLE account TO polkastats;
GRANT ALL PRIVILEGES ON TABLE phragmen TO polkastats;
GRANT ALL PRIVILEGES ON TABLE system TO polkastats;
GRANT ALL PRIVILEGES ON TABLE chain TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator TO polkastats;
GRANT ALL PRIVILEGES ON TABLE intention TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_era_staking TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_era_slash TO polkastats;
GRANT ALL PRIVILEGES ON TABLE nominator_era_slash TO polkastats;
GRANT ALL PRIVILEGES ON TABLE total TO polkastats;

ALTER TABLE account 
  ALTER COLUMN available_balance TYPE TEXT,
  ALTER COLUMN nonce TYPE TEXT;  

CREATE SEQUENCE IF NOT EXISTS serial START 1;

CREATE TABLE IF NOT EXISTS tokens (
  id INT PRIMARY KEY DEFAULT nextval('serial'), 
  token_id INT NOT NULL,
  collection_id INT NOT NULL,
  owner TEXT NOT NULL  
);

ALTER TABLE IF EXISTS collection 
  RENAME TO collections;

UPDATE total SET name = 'tokens' WHERE name = 'token';
UPDATE total SET name = 'collections' WHERE name = 'collection';