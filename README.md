# PolkaStats Backend v3

New improved backend for https://polkastats.io!

<!--ts-->

### Table of Contents

   * [Installation Instructions](#installation-instructions)
   * [Usage Instructions](#usage-instructions)
   * [List of current containers](#list-of-current-containers)
   * [Updating containers](#updating-containers)
   * [Crawlers](#crawlers)
      * [Block listener](#block-listener)
      * [Block harvester](#block-harvester)

<!--te-->

## Installation Instructions

```
git clone https://github.com/Colm3na/polkastats-backend-v3.git
cd polkastats-backend-v3
npm install
```

## Usage Instructions

To launch all docker containers at once:
```
npm run docker
```
To run them separately:
```
npm run docker:<container-name>
```

## List of current containers

- postgres
- graphql-engine
- substrate-node

    Crawlers:
- listener
- harvester

## Updating containers

```
git pull
npm run docker:clean
npm run docker:build
npm run docker
```

## Crawlers

### Block listener

This crawler listens to new blocks and adds them to database:

```
node crawlers/block-listener.js
```

Example output:

```
[PolkaStats backend v3] - Block listener - Adding block #879,810 [0x59b8723d131cf917db34e001a52535e206b1018109c0723bdc901426131d1864]
[PolkaStats backend v3] - Block listener - Adding block #879,811 [0xaac6552cbde6ca65eab7b7cf3639b2425597d357a225fef4f4c8782b953ebf60]
[PolkaStats backend v3] - Block listener - Adding block #879,812 [0xe42a28d132128f5e068b3342b54df3540ed10e215ed672193d08647aee6e9918]
[PolkaStats backend v3] - Block listener - Adding block #879,813 [0x92597fdf9a620a31df89f7052f81179e254d51da66a947cacbb3f3ab4633fc9e]
[PolkaStats backend v3] - Block listener - Adding block #879,814 [0x4ec3df2b8a815bbf23abc707432fcfb528a9ebeb183b9d0a4e3741ee6da36978]
...
```

### Block harvester

This crawler fills the gaps in the `block` table.

This is intented to run periodically (i.e 1 time per day) to fill possible gaps caused by server restarts or other problems.

```
node crawlers/block-harvester.js
```

Example output:

```
[PolkaStats backend v3] - Block harvester - Added block #59,083 [0x9fbe838753e3403a550584a16f4ec5d7fd081d4ae416f3ae7e9a714d84fe81da] in 0.131s
[PolkaStats backend v3] - Block harvester - Added block #59,084 [0xd9c97595fedd77f42f64d57f36abca4bb49114d5363ad693b63f361471b53b68] in 0.066s
[PolkaStats backend v3] - Block harvester - Added block #59,085 [0xe035e4c19879ef3ffb650eafee4a9fc592ac187e90c2f833201a07a2e97a9413] in 0.100s
[PolkaStats backend v3] - Block harvester - Added block #59,086 [0x2310c6b49f8f2779f95a877f891e2dea07090a1809313205e2e1700febce0fc8] in 0.056s
[PolkaStats backend v3] - Block harvester - Added block #59,087 [0xfcfcb2bcc4a076b0816047e6b05b6aea379b1526d47deb6bb45086bec0b0751f] in 0.107s
...
```
