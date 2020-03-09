FROM rust AS builder

RUN mkdir -p /app; \
    wget https://github.com/mariopino/offline-phragmen/archive/master.zip; \
    unzip master.zip -d /app/

WORKDIR /app/offline-phragmen-master

RUN cargo build --release

FROM node

WORKDIR /app

COPY --from=builder /app/offline-phragmen-master/target/release/offline-phragmen /app

COPY . /app

RUN npm install 

ENTRYPOINT ["node"]