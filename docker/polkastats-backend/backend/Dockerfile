FROM node:lts-alpine3.9

RUN apk add git

WORKDIR /usr/app

RUN git clone https://github.com/Colm3na/polkastats-backend-v3.git

WORKDIR /usr/app/polkastats-backend-v3

RUN npm install 

ENTRYPOINT ["node"]
