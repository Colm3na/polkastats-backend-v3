# Docker

## Build

```
git clone https://github.com/Colm3na/polkastats-backend-v3.git
cd polkastats-backend-v3/docker/polkastats-backend
# To create the images
docker-compose build
```

## Run in background

```
# To create the containers based on current branch
docker-compose up -d
```

## Check
```
docker logs [CONTAINER] -f --tail 10
```

## Stop

```
docker-compose stop
```

# Backup and Restore development laboratory

## HowTo quickly spin up a new Lab

Steps_:

1- Git clone
2- Download substrate data base
3- Build images
4- Restore data base

Dockers save their data in persistent volumes. Thus, when destroying and re-build the lab those volumes still have a copy of the substrate node data base and postgres database.

### 1 Git clone

```
cd
git clone https://github.com/Colm3na/polkastats-backend-v3.git
git checkout develop
```

### 2 Download substrate data base (new terminal, it takes a while)

```
cd
mkdir backup
cd backup
wget https://polkastats.io/downloads/substrate-data.tar
cp ~/polkastats-backend-v3/docker/polkastats-backend/substrate-client/restore-backup ~/backup
```

### 3 Build images

```
cd ~/polkastats-backend-v3/docker/polkastats-backend
docker-compose up -d
```

### 4 Restore data base (we need the downloaded file of step #2)

```
cd ~/backup
./resotore-backup
cd ~/polkastats-backend-v3/docker/polkastats-backend
docker-compose up -d
```

### 5 Create an updated backup file

```
cd ~/backup
mv substrate-data.tar substrate-data___DATE.tar.gz
cp ~/polkastats-backend-v3/docker/polkastats-backend/substrate-client/start-backup ~/backup
./start-backup
```