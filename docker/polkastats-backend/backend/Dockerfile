FROM node:lts-alpine3.9

RUN apk add git

RUN mkdir -p /usr/app

WORKDIR /usr/app

# Set GIT_BRANCH to develop if not exist
ENV GIT_BRANCH=${GIT_BRANCH:-develop}

RUN git clone -b $GIT_BRANCH https://github.com/Colm3na/polkastats-backend-v3.git

WORKDIR /usr/app/polkastats-backend-v3

RUN npm install 

ENTRYPOINT ["node"]
