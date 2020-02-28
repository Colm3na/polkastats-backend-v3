FROM node:lts-alpine3.9

RUN apk add git wget tar

RUN mkdir -p /usr/app

WORKDIR /usr/app

COPY . /usr/app/polkastats-backend-v3

WORKDIR /usr/app/polkastats-backend-v3

RUN wget https://polkastats.io/downloads/offline-phragmen-latest.tar.gz && \
    tar xzvf offline-phragmen-latest.tar.gz

RUN npm install 

ENTRYPOINT ["node"]
