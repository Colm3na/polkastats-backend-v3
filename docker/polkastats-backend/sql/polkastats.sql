GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;

CREATE TABLE IF NOT EXISTS block (  
   block_number BIGINT NOT NULL,
   block_author VARCHAR(47) NOT NULL,
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
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, era_index, stash_id )  
);

CREATE TABLE IF NOT EXISTS validator_staking  (  
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   json TEXT NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index )  
);

CREATE TABLE IF NOT EXISTS intention_staking  (  
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   json TEXT NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index )  
);

CREATE TABLE IF NOT EXISTS validator_bonded  (
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   account_id VARCHAR(47) NOT NULL,     
   amount BIGINT NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_selfbonded  (
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   account_id VARCHAR(47) NOT NULL,     
   amount BIGINT NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_num_nominators  (
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   account_id VARCHAR(47) NOT NULL,     
   nominators INT NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_era_points  (
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   account_id VARCHAR(47) NOT NULL,     
   era_points INT NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS validator_active  (
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   account_id VARCHAR(47) NOT NULL,     
   active BOOLEAN NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index, account_id )  
);

CREATE TABLE IF NOT EXISTS account  (  
   account_id VARCHAR(100) NOT NULL,
   identity TEXT NOT NULL,
   balances TEXT NOT NULL,
   timestamp BIGINT NOT NULL,
   block_height BIGINT NOT NULL,
   PRIMARY KEY ( account_id )  
);

CREATE TABLE IF NOT EXISTS polkastats_identity (  
   account_id VARCHAR(100) NOT NULL,
   username VARCHAR(50) NOT NULL,
   username_cased VARCHAR(50) NOT NULL,
   full_name VARCHAR(100) NOT NULL,
   location VARCHAR(100) NOT NULL,
   bio VARCHAR(200) NOT NULL,
   logo VARCHAR(100) NOT NULL,
   website VARCHAR(100) NOT NULL,
   twitter VARCHAR(100) NOT NULL,
   github VARCHAR(100) NOT NULL, 
   created INT(8) NOT NULL,    
   updated INT(8) NOT NULL,
   PRIMARY KEY ( account_id )
);

CREATE INDEX IF NOT EXISTS validator_bonded_account_id_idx ON validator_bonded (account_id);
CREATE INDEX IF NOT EXISTS validator_selfbonded_account_id_idx ON validator_selfbonded (account_id);
CREATE INDEX IF NOT EXISTS validator_num_nominators_account_id_idx ON validator_num_nominators (account_id);
CREATE INDEX IF NOT EXISTS validator_era_points_account_id_idx ON validator_era_points (account_id);
CREATE INDEX IF NOT EXISTS validator_active_account_id_idx ON validator_active (account_id);

GRANT ALL PRIVILEGES ON TABLE validator_staking TO polkastats;
GRANT ALL PRIVILEGES ON TABLE intention_staking TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_bonded TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_selfbonded TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_num_nominators TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_era_points TO polkastats;
GRANT ALL PRIVILEGES ON TABLE validator_active TO polkastats;
GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
GRANT ALL PRIVILEGES ON TABLE event TO polkastats;
GRANT ALL PRIVILEGES ON TABLE rewards TO polkastats;
GRANT ALL PRIVILEGES ON TABLE account TO polkastats;
GRANT ALL PRIVILEGES ON TABLE phragmen TO polkastats;
GRANT ALL PRIVILEGES ON TABLE polkastats_identity TO polkastats;