FROM node:lts-alpine3.9

RUN apk add git wget tar

RUN mkdir -p /usr/{app,offline-phragmen}

WORKDIR /usr/app

COPY . /usr/app/polkastats-backend-v3

WORKDIR /usr/app/offline-phragmen

RUN wget https://polkastats.io/downloads/mario-offline-phragmen.tar.gz && \
    tar xzvf mario-offline-phragmen.tar.gz

RUN npm install 

ENTRYPOINT ["node"]
