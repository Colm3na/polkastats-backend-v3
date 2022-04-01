#FROM rust AS builder
#
FROM node:lts

WORKDIR /usr/app/polkastats-backend-v3

#RUN wget https://github.com/Colm3na/polkastats-backend-v3/raw/develop/docker/offline-election/offline-election; \
#    chmod +x offline-election

COPY . /usr/app/polkastats-backend-v3

RUN npm install 

EXPOSE 9003
CMD ["npm", "start"]

