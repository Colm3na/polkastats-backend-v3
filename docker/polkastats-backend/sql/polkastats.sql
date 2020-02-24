GRANT ALL PRIVILEGES ON DATABASE polkastats TO polkastats;
CREATE TABLE block (  
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
   -- total_extrinsics INT NOT NULL,
   -- total_signed_extrinsics INT NOT NULL,
   -- total_failed_extrinsics INT NOT NULL,
   -- total_events INT NOT NULL,
   -- total_system_events INT NOT NULL,
   -- total_module_events INT NOT NULL,
   -- new_accounts INT NOT NULL,
   -- reaped_accounts INT NOT NULL,
   -- new_contracts INT NOT NULL,
   -- new_sessions INT NOT NULL,
   timestamp BIGINT NOT NULL,
   PRIMARY KEY ( block_number )  
);
CREATE TABLE event (  
   block_number BIGINT NOT NULL,
   event_index INT NOT NULL,
   section VARCHAR(100) NOT NULL,
   method VARCHAR(100) NOT NULL,
   phase VARCHAR(100) NOT NULL,
   data TEXT NOT NULL,
   PRIMARY KEY ( block_number, event_index ) 
);

CREATE TABLE rewards (
   block_number BIGINT NOT NULL,
   session_index INT NOT NULL,
   stash_id VARCHAR(50),
   commission BIGINT,
   era_rewards TEXT,
   stake_info TEXT,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number, session_index )  
);
GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
GRANT ALL PRIVILEGES ON TABLE event TO polkastats;
GRANT ALL PRIVILEGES ON TABLE rewards TO polkastats;
