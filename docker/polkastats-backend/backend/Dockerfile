FROM node:lts-alpine3.9

RUN apk add git

RUN mkdir -p /usr/app

WORKDIR /usr/app

COPY . /usr/app/polkastats-backend-v3

WORKDIR /usr/app/polkastats-backend-v3

RUN npm install 

ENTRYPOINT ["node"]
