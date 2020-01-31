FROM node:lts-alpine3.9

RUN apk add git

WORKDIR /usr/app

RUN git clone https://github.com/Colm3na/polkastats-backend-v2.git

WORKDIR /usr/app/polkastats-backend-v2

RUN npm install 
#--quiet

ENTRYPOINT ["node"]
