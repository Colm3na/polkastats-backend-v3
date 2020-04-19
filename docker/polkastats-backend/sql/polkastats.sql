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
  account_id VARCHAR(47) NOT NULL,
  identity TEXT NOT NULL,
  balances TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  block_height BIGINT NOT NULL,
  PRIMARY KEY ( account_id )  
);

CREATE TABLE IF NOT EXISTS system  (
  block_height BIGINT NOT NULL,
  node_name VARCHAR(100) NOT NULL,
  node_version VARCHAR(100) NOT NULL,
  timestamp INT NOT NULL,
  PRIMARY KEY ( block_height )  
);

CREATE TABLE IF NOT EXISTS polkastats_identity (  
  account_id VARCHAR(47) NOT NULL,
  username VARCHAR(100) NOT NULL,
  username_cased VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  bio VARCHAR(200) NOT NULL,
  logo VARCHAR(100) NOT NULL,
  website VARCHAR(100) NOT NULL,
  twitter VARCHAR(100) NOT NULL,
  github VARCHAR(100) NOT NULL, 
  created INT NOT NULL,    
  updated INT NOT NULL,
  PRIMARY KEY ( account_id )
);

INSERT INTO `polkastats_identity` VALUES 
  (
    'CanLB42xJughpTRC1vXStUryjWYkE679emign1af47QnAQC', 
    '5chdn',
    '5chdn',
    'Afri Schoedon', 
    'Berlin, Germany.', 'Everything Ethereum at Parity.', 
    'https://s3.amazonaws.com/keybase_processed_uploads/e45398395dc357c5920514fba64ffe05_360_360.jpg', 
    'http://5chdn.co',
    '',
    'https://github.com/5chdn', 
    1587202202,
    1587202202
  ), 
  (
    'CoqysGbay3t3Q7hXgEmGJJquhYYpo8PqLwvW1WsUwR7KvXm', 
    'deleganetworks',
    'DelegaNetworks', 
    'Delega Networks',
    'Blockchain', 
    'Your trusted PoS validator',
    'https://s3.amazonaws.com/keybase_processed_uploads/9769abccf1bee6c032fb5be50d6c3c05_360_360.jpg', 
    '',
    'https://twitter.com/deleganetworks', 
    '',
    1587202203,
    1587202203
  ), 
  (
    'CsHw8cfzbnKdkCuUq24yuaPyJ1E5a55sNPqejJZ4h7CRtEs', 
    'bneiluj',
    'bneiluj',
    'Julien Bouteloup', 
    'London',
    'Engineer / Dev / Economist / crypto cyberpunk', 
    'https://s3.amazonaws.com/keybase_processed_uploads/529c4d56e2e77b663224aca276549d05_360_360.jpg', 
    '',
    'https://twitter.com/bneiluj', 
    'https://github.com/bneiluj',
    1587202203, 
    1587202203
  ), 
  (
    'D8rBgbN7NWa4k9Wa5aeupP2rjo6iYoHPTxxJU5ef35PUQJN', 
    'pos_bakerz',
    'pos_bakerz',
    'POS Bakerz', 
    'Based in Europe',
    'Secure, Efficient, and Reliable Staking-as-a-Service Provider', 
    'https://s3.amazonaws.com/keybase_processed_uploads/f91a58793b597a3c76ecc58897e6e905_360_360.jpg', 
    '',
    '',
    'https://github.com/posbakerz', 
    1587202204,
    1587202204
  ), 
  (
    'D9rwRxuG8xm8TZf5tgkbPxhhTJK5frCJU9wvp59VRjcMkUf', 
    'forbole',
    'forbole',
    'Forbole', 
    'Cosmos',
    'Forbole - An incentivised social ecosystem on blockchain', 
    'https://s3.amazonaws.com/keybase_processed_uploads/f5b0771af36b2e3d6a196a29751e1f05_360_360.jpeg', 
    'http://forbole.com',
    '',
    '',
    1587202205, 
    1587202205
  ), 
  (
    'DNDBcYD8zzqAoZEtgNzouVp2sVxsvqzD4UdB5WrAUwjqpL8', 
    'simplyvc',
    'SimplyVC',
    'Simply VC', 
    'Malta',
    'Simply VC consists of a team of security, cryptocurrency & business experts passionate about supporting the blockchain ecosystem.', 
    'https://s3.amazonaws.com/keybase_processed_uploads/832fd8e95710fb345f084afb8aeace05_360_360.jpg', 
    'https://simply-vc.com.mt', '', 
    'https://github.com/SimplyVC', 
    1587202205,
    1587202205
  ), 
  (
    'DSpbbk6HKKyS78c4KDLSxCetqbwnsemv2iocVXwNe2FAvWC', 
    'dragonstake',
    'dragonstake',
    'DragonStake', 
    'Decentralized',
    'Trusted Blockchain Validators', 
    'https://s3.amazonaws.com/keybase_processed_uploads/c62c205359734ddf9af1b03777703505_360_360.jpg', 
    'http://dragonstake.io',
    'https://twitter.com/dragonstake', 
    'https://github.com/dragonstake', 
    1587202206,
    1587202206
  ), 
  (
    'DTLcUu92NoQw4gg6VmNgXeYQiNywDhfYMQBPYg2Y1W6AkJF', 
    'fgimenez',
    'fgimenez',
    'Federico Gimenez', 
    'Madrid',
    'Infrastructure Lead @Web3 Foundation', 
    'https://s3.amazonaws.com/keybase_processed_uploads/6975bd9d417a2088e6d8a6987a43a405_360_360.jpg', 
    '',
    'https://twitter.com/frgnieto', 
    'https://github.com/fgimenez', 
    1587202206,
    1587202206
  ), 
  (
    'Dab4bfYTZRUDMWjYAUQuFbDreQ9mt7nULWu3Dw7jodbzVe9', 
    '5chdn',
    '5chdn',
    'Afri Schoedon', 
    'Berlin, Germany.',
    'Everything Ethereum at Parity.', 
    'https://s3.amazonaws.com/keybase_processed_uploads/e45398395dc357c5920514fba64ffe05_360_360.jpg', 
    'http://5chdn.co',
    '',
    'https://github.com/5chdn', 
    1587202207,
    1587202207
  ), 
  (
    'DbAdiLJQDFzLyaLsoFCzrpBLuaBXXqQKdpewUSxqiWJadmp', 
    'inchain',
    'inchain',
    'InChainWorks', 
    'null',
    'Trusted & Secure Blockchain Investment', 
    'https://s3.amazonaws.com/keybase_processed_uploads/4de135b8a487f19d837486cf4ab14905_360_360.jpg', 
    'https://inchain.works',
    'https://twitter.com/inchain_works', 
    'https://github.com/abouzidi', 
    1587202208,
    1587202208
  ), 
  (
    'ET9SkhNZhY7KT474vkCEJtAjbgJdaqAGW4beeeUJyDQ3SnA', 
    'dokiacapital',
    'dokiacapital', 
    'Dokia Capital',
    'Earth',
    'Proof of Stake infrastructure provider. ⛓', 
    'https://s3.amazonaws.com/keybase_processed_uploads/64dc60dc1e68999354f19558603eb305_360_360.jpg', 
    'https://dokia.capital',
    'https://twitter.com/DokiaCapital', 
    '',
    1587202208,
    1587202208
  ), 
  (
    'EdUs96fjEhyaTVxZsFo3fxEABLSpdopBFuhE7FFexCUyDv6', 
    'lionstake',
    'LionStake',
    'LionStake 🦁', 
    'León - Spain', 'Secure and reliable Proof of Stake Infrastructure Services', 
    'https://s3.amazonaws.com/keybase_processed_uploads/10da34e641c449e417870335e9399f05_360_360.jpg', 
    '',
    'https://twitter.com/lion_stake', 
    'https://github.com/lion-stake', 
    1587202209,
    1587202209
  ), 
  (
    'EqyCQvYn1cHBdzFVQHQeL1nHDcxHhjWR8V48KbDyHyuyCGV', 
    'realgar',
    'Realgar',
    'realgar', 
    'Italy',
    'Governance experimenter, validator, researcher\nUnited Networks of State Machines', 
    'https://s3.amazonaws.com/keybase_processed_uploads/cf09c45d1245d186a6aad09112c20b05_360_360.jpg', 
    'https://polkadot.pro', 'https://twitter.com/ProPolkadot', 
    'https://github.com/Realgar',
    1587202209, 
    1587202209
  ), 
  (
    'ErhkFXudde5xXFVMGUtNpiPLvZ9zcvqM3ueRLukDdpjszys', 
    'bitcat365',
    'bitcat365',
    'Bit Cat🐱', 
    'China',
    'Secure and stable validator service from China team.', 
    'https://s3.amazonaws.com/keybase_processed_uploads/e6d2c9be95cde136dcf0ade7238f1705_360_360.jpg', 
    '',
    '',
    '',
    1587202210,
    1587202210
  ), 
  (
    'FcjmeNzPk3vgdENm1rHeiMCxFK96beUoi2kb59FmCoZtkGF', 
    'gnossienli',
    'gnossienli',
    'gnossienli', 
    'NL',
    'Kusama/Solana/Terra/Polkadot/Edgeware Validator/Coda/Near/', 
    'https://s3.amazonaws.com/keybase_processed_uploads/eb746a3b7016604688933baba52cda05_360_360.jpg', 
    'https://staker.space', 'https://twitter.com/stakerspace', 
    'https://github.com/stakerspace', 
    1587202210,
    1587202210
  ), 
  (
    'GTzRQPzkcuynHgkEHhsPBFpKdh4sAacVRsnd8vYfPpTMeEY', 
    'polkastats',
    'PolkaStats',
    'PolkaStats', 
    'Decentralized hyperspace',
    'PolkaStats, Polkadot Kusama network statistics', 
    'https://s3.amazonaws.com/keybase_processed_uploads/ceb4f17440dc978fa4faa64814290005_360_360.jpg', 
    'https://polkastats.io',
    'https://twitter.com/polkastats', 
    'https://github.com/mariopino', 
    1587202211,
    1587202211
  ), 
  (
    'GXaUd6gyCaEoBVzXnkLVGneCF3idnLNtNZs5RHTugb9dCpY', 
    'stakedotfish',
    'stakedotfish', 
    'stakefish',
    'null',
    'null',
    'https://s3.amazonaws.com/keybase_processed_uploads/a45f7abadca25326bc31157dd7aa3605_360_360.jpg', 
    'https://stake.fish',
    'https://twitter.com/stakedotfish', 
    '',
    1587202212,
    1587202212
  ), 
  (
    'GhoRyTGK583sJec8aSiyyJCsP2PQXJ2RK7iPGUjLtuX8XCn', 
    'purestake',
    'purestake',
    'PureStake', 
    'USA',
    'Secure & Reliable API, Infrastructure, and Validator Services for Next-Generation Proof of Stake Blockchain Networks', 
    'https://s3.amazonaws.com/keybase_processed_uploads/a175d8c5bc90a128db2305c0faa30d05_360_360.jpg', 
    'https://www.purestake.com',
    'https://twitter.com/purestakeco', 
    '',
    1587202212,
    1587202212
  ), 
  (
    'Ghw9swKjtCTZfEqEmzZkkqK4vEKQFz86HctEdGprQbNzpc7', 
    '5chdn',
    '5chdn',
    'Afri Schoedon', 
    'Berlin, Germany.',
    'Everything Ethereum at Parity.', 
    'https://s3.amazonaws.com/keybase_processed_uploads/e45398395dc357c5920514fba64ffe05_360_360.jpg', 
    'http://5chdn.co',
    '',
    'https://github.com/5chdn', 
    1587202213,
    1587202213
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
GRANT ALL PRIVILEGES ON TABLE system TO polkastats;