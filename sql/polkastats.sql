CREATE TABLE block (  
   block_number BIGINT NOT NULL,
   block_finalized BIGINT NOT NULL,
   block_author VARCHAR(47) NOT NULL,
   block_hash VARCHAR(66) NOT NULL,
   parent_hash VARCHAR(66) NOT NULL,
   extrinsics_root VARCHAR(66) NOT NULL,
   state_root VARCHAR(66) NOT NULL,
   total_issuance VARCHAR(50) NOT NULL,
   session_json TEXT NOT NULL,
   timestamp INT NOT NULL,
   PRIMARY KEY ( block_number )  
);