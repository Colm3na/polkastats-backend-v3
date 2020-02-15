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
   timestamp BIGINT NOT NULL,
   PRIMARY KEY ( block_number )  
);
GRANT ALL PRIVILEGES ON TABLE block TO polkastats;
