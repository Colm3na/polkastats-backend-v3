CREATE DATABASE polkastats;

SET NAMES utf8mb4; 

ALTER DATABASE polkastats CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

GRANT ALL PRIVILEGES ON polkastats.* to polkastats@localhost identified by 'polkastats';

USE polkastats;

CREATE TABLE system (  
   id INT NOT NULL AUTO_INCREMENT,
   chain VARCHAR(50) NOT NULL,
   client_name VARCHAR(50) NOT NULL,
   client_version VARCHAR(50) NOT NULL,
   timestamp INT(8) NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE chain (  
   id INT NOT NULL AUTO_INCREMENT,
   block_height INT(8) NOT NULL,
   block_height_finalized INT(8) NOT NULL,
   session_json MEDIUMTEXT NOT NULL,
   total_issuance VARCHAR(50) NOT NULL,
   timestamp INT(8) NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE validator (  
   id INT NOT NULL AUTO_INCREMENT,
   block_height INT(8) NOT NULL,  
   timestamp INT(8) NOT NULL,  
   json MEDIUMTEXT NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE validator_intention (  
   id INT NOT NULL AUTO_INCREMENT,
   block_height INT(8) NOT NULL,  
   timestamp INT(8) NOT NULL,  
   json MEDIUMTEXT NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE validator_bonded (  
   id INT NOT NULL AUTO_INCREMENT,
   accountId VARCHAR(50) NOT NULL,
   timestamp INT(8) NOT NULL,  
   amount VARCHAR(50) NOT NULL,
   json MEDIUMTEXT NOT NULL,
   PRIMARY KEY ( id )  
);

ALTER TABLE `validator_bonded` ADD INDEX `accountId` (`accountId`);
ALTER TABLE `validator_bonded` ADD INDEX `timestamp` (`timestamp`);

CREATE TABLE intention_bonded (  
   id INT NOT NULL AUTO_INCREMENT,
   accountId VARCHAR(50) NOT NULL,
   timestamp INT(8) NOT NULL,  
   amount VARCHAR(50) NOT NULL,
   json MEDIUMTEXT NOT NULL,
   PRIMARY KEY ( id )  
);

ALTER TABLE `intention_bonded` ADD INDEX `accountId` (`accountId`);
ALTER TABLE `intention_bonded` ADD INDEX `timestamp` (`timestamp`);

CREATE TABLE validator_offline (  
   id INT NOT NULL AUTO_INCREMENT,
   accountId VARCHAR(50) NOT NULL,
   block_height INT(8) NOT NULL,  
   times INT(8) NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE keybase_identity (  
   id INT NOT NULL AUTO_INCREMENT,
   stashId VARCHAR(50) NOT NULL,
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
   PRIMARY KEY ( id )  
);

CREATE TABLE account_nickname (  
   id INT NOT NULL AUTO_INCREMENT,
   accountId VARCHAR(50) NOT NULL,
   nickname VARCHAR(100) NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE phragmen (  
   id INT NOT NULL AUTO_INCREMENT,
   phragmen_json MEDIUMTEXT NOT NULL,
   timestamp INT(8) NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE event (  
   id INT NOT NULL AUTO_INCREMENT,
   blockNumber BIGINT NOT NULL,
   eventIndex INT NOT NULL,
   section VARCHAR(100) NOT NULL,
   method VARCHAR(100) NOT NULL,
   phase VARCHAR(100) NOT NULL,
   data MEDIUMTEXT NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE account_index (  
   id INT NOT NULL AUTO_INCREMENT,
   accountId VARCHAR(50) NOT NULL,
   accountIndex VARCHAR(50) NOT NULL,
   PRIMARY KEY ( id )  
);

CREATE TABLE block (  
   block_number BIGINT NOT NULL,
   block_finalized BIGINT NOT NULL,
   block_author VARCHAR(47) NOT NULL,
   block_hash VARCHAR(66) NOT NULL,
   parent_hash VARCHAR(66) NOT NULL,
   extrinsics_root VARCHAR(66) NOT NULL,
   state_root VARCHAR(66) NOT NULL,
   total_issuance VARCHAR(50) NOT NULL,
   session_json MEDIUMTEXT NOT NULL,
   timestamp INT(8) NOT NULL,
   PRIMARY KEY ( block_number )  
);

CREATE TABLE account (  
   accountId VARCHAR(47) NOT NULL,
   accountIndex VARCHAR(47) NOT NULL,
   nickname VARCHAR(100) NOT NULL,
   identity VARCHAR(300) NOT NULL,
   balances MEDIUMTEXT NOT NULL,
   PRIMARY KEY ( accountId )  
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE account_identity (  
   id INT NOT NULL AUTO_INCREMENT,
   accountId VARCHAR(50) NOT NULL,
   identity VARCHAR(300) NOT NULL,
   PRIMARY KEY ( id )  
) DEFAULT CHARSET=utf8mb4;
