# Docker

## Build

git clone https://github.com/Colm3na/polkastats-backend-v3.git
cd docker
docker-compose build

## Run in background
docker-compose up -d

## Check
docker logs docker_substrate-node_1 -f

## Stop
docker-compose stop
