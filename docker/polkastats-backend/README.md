# Docker

## Build

```
git clone https://github.com/Colm3na/polkastats-backend-v3.git
cd docker/polkastats-backend
# To create the images
docker-compose build
```

## Run in background
```
# To create the containers from current branch
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD) && docker-compose up -d
```

Crawlers will fail to connect to the substrate node at this point. We need to wait for the node to completely sync or you could restore a substrate data base.
There are some usefull backup and restore scripts in this repo for developing purposes. (docker/polkastats-backend/substrate-client)


## Check
```
docker logs [CONTAINER] -f --tail 10
```

## Stop
```
docker-compose stop
```
