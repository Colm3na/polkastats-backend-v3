FROM rust AS builder

RUN mkdir -p /app; \
    wget https://github.com/bigomby/offline-phragmen/archive/master.zip; \
    unzip master.zip -d /app/

WORKDIR /app/offline-phragmen-master

RUN cargo build --release

FROM node

WORKDIR /usr/app/polkastats-backend-v3

COPY --from=builder /app/offline-phragmen-master/target/release/offline-phragmen /usr/app/polkastats-backend-v3

COPY . /usr/app/polkastats-backend-v3

RUN npm install 

CMD ["npm", "start"]