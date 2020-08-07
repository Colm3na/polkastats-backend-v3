#FROM rust AS builder
#
FROM node:erbium

WORKDIR /usr/app/polkastats-backend-v3

RUN wget https://github.com/Colm3na/polkastats-backend-v3/raw/develop/docker/offline-election/offline-election; \
    chmod +x offline-election

COPY . /usr/app/polkastats-backend-v3

RUN npm install 

CMD ["npm", "start"]
