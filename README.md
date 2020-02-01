# PolkaStats Backend v3

## Install

```
git clone https://github.com/Colm3na/polkastats-backend-v3.git
cd polkastats-backend-v3
npm install
```

## Import database

```
su - postgres
createdb polkastats
psql polkastats < sql/polkastats.sql
```

## Crawlers

### Block listener

This crawler listen to new blocks and add them to database:

```
node crawlers/block-listener.js
```

### Block harvester

This crawler fill the gaps in block table.

This is intented to run periodically (i.e 1 time per day) to fill possible gaps caused by server restarts or other problems.

```
node crawlers/block-harvester.js
```
