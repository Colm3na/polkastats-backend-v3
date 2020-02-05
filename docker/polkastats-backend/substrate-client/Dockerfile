FROM phusion/baseimage:0.11
LABEL maintainer "@ColmenaLabs_svq"
LABEL description="Small image with the Substrate binary."

RUN apt-get update && apt-get install wget curl jq -y

WORKDIR /usr/local/bin

RUN wget https://polkastats.io/polkadot/latest.tar.gz \
    && tar zxvpf latest.tar.gz && rm latest.tar.gz

# FINAL PREPARATIONS
EXPOSE 30333 9933 9944

VOLUME ["/data"]

#CMD ["/usr/local/bin/polkadot"]
ENTRYPOINT ["polkadot"]
CMD ["--dev"]
