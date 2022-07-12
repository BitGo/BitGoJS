FROM node:16-alpine@sha256:72a490e7ed8aed68e16b8dc8f37b5bcc35c5b5c56ee3256effcdee63e2546f93 AS builder
MAINTAINER Tyler Levine <tyler@bitgo.com>
RUN apk add --no-cache git python3 make g++ libtool autoconf automake
WORKDIR /tmp/bitgo
COPY . .
RUN \
    # clean up unnecessary local node_modules and dist
    rm -rf **/node_modules **/dist && \ 
    # install with dev deps so we can run the prepare script
    yarn install --frozen-lockfile && \
    # install again to prune dev deps
    yarn install --production --frozen-lockfile --non-interactive --ignore-scripts && \
    # remove any src code leftover (we only want dist)
    rm -r modules/*/src
    

FROM node:16-alpine@sha256:72a490e7ed8aed68e16b8dc8f37b5bcc35c5b5c56ee3256effcdee63e2546f93
RUN apk add --no-cache tini
# copy the root node_modules to the bitgo-express parent node_modules
COPY --from=builder /tmp/bitgo/node_modules  /var/node_modules/
COPY --from=builder /tmp/bitgo/modules/express /var/bitgo-express/

#COPY_START
COPY --from=builder /tmp/bitgo/modules/bitgo /var/modules/bitgo/
RUN cd /var/modules/bitgo && yarn link
COPY --from=builder /tmp/bitgo/modules/abstract-eth /var/modules/abstract-eth/
RUN cd /var/modules/abstract-eth && yarn link
COPY --from=builder /tmp/bitgo/modules/account-lib /var/modules/account-lib/
RUN cd /var/modules/account-lib && yarn link
COPY --from=builder /tmp/bitgo/modules/blake2b /var/modules/blake2b/
RUN cd /var/modules/blake2b && yarn link
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm /var/modules/blake2b-wasm/
RUN cd /var/modules/blake2b-wasm && yarn link
COPY --from=builder /tmp/bitgo/modules/bls-dkg /var/modules/bls-dkg/
RUN cd /var/modules/bls-dkg && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-algo /var/modules/sdk-coin-algo/
RUN cd /var/modules/sdk-coin-algo && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-api /var/modules/sdk-api/
RUN cd /var/modules/sdk-api && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-core /var/modules/sdk-core/
RUN cd /var/modules/sdk-core && yarn link
COPY --from=builder /tmp/bitgo/modules/statics /var/modules/statics/
RUN cd /var/modules/statics && yarn link
COPY --from=builder /tmp/bitgo/modules/utxo-lib /var/modules/utxo-lib/
RUN cd /var/modules/utxo-lib && yarn link
COPY --from=builder /tmp/bitgo/modules/sjcl /var/modules/sjcl/
RUN cd /var/modules/sjcl && yarn link
COPY --from=builder /tmp/bitgo/modules/unspents /var/modules/unspents/
RUN cd /var/modules/unspents && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-avaxc /var/modules/sdk-coin-avaxc/
RUN cd /var/modules/sdk-coin-avaxc && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-avaxp /var/modules/sdk-coin-avaxp/
RUN cd /var/modules/sdk-coin-avaxp && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-cspr /var/modules/sdk-coin-cspr/
RUN cd /var/modules/sdk-coin-cspr && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-eth /var/modules/sdk-coin-eth/
RUN cd /var/modules/sdk-coin-eth && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-stx /var/modules/sdk-coin-stx/
RUN cd /var/modules/sdk-coin-stx && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-xtz /var/modules/sdk-coin-xtz/
RUN cd /var/modules/sdk-coin-xtz && yarn link
COPY --from=builder /tmp/bitgo/modules/abstract-utxo /var/modules/abstract-utxo/
RUN cd /var/modules/abstract-utxo && yarn link
COPY --from=builder /tmp/bitgo/modules/blockapis /var/modules/blockapis/
RUN cd /var/modules/blockapis && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-ada /var/modules/sdk-coin-ada/
RUN cd /var/modules/sdk-coin-ada && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-bch /var/modules/sdk-coin-bch/
RUN cd /var/modules/sdk-coin-bch && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-bcha /var/modules/sdk-coin-bcha/
RUN cd /var/modules/sdk-coin-bcha && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-bsv /var/modules/sdk-coin-bsv/
RUN cd /var/modules/sdk-coin-bsv && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-btc /var/modules/sdk-coin-btc/
RUN cd /var/modules/sdk-coin-btc && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-btg /var/modules/sdk-coin-btg/
RUN cd /var/modules/sdk-coin-btg && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-celo /var/modules/sdk-coin-celo/
RUN cd /var/modules/sdk-coin-celo && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-dash /var/modules/sdk-coin-dash/
RUN cd /var/modules/sdk-coin-dash && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-ltc /var/modules/sdk-coin-ltc/
RUN cd /var/modules/sdk-coin-ltc && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-rbtc /var/modules/sdk-coin-rbtc/
RUN cd /var/modules/sdk-coin-rbtc && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-xrp /var/modules/sdk-coin-xrp/
RUN cd /var/modules/sdk-coin-xrp && yarn link
COPY --from=builder /tmp/bitgo/modules/sdk-coin-zec /var/modules/sdk-coin-zec/
RUN cd /var/modules/sdk-coin-zec && yarn link
#COPY_END

#LINK_START
RUN cd /var/bitgo-express && \
    yarn link bitgo && \
    yarn link @bitgo/abstract-eth && \
    yarn link @bitgo/account-lib && \
    yarn link @bitgo/blake2b && \
    yarn link @bitgo/blake2b-wasm && \
    yarn link @bitgo/bls-dkg && \
    yarn link @bitgo/sdk-coin-algo && \
    yarn link @bitgo/sdk-api && \
    yarn link @bitgo/sdk-core && \
    yarn link @bitgo/statics && \
    yarn link @bitgo/utxo-lib && \
    yarn link @bitgo/sjcl && \
    yarn link @bitgo/unspents && \
    yarn link @bitgo/sdk-coin-avaxc && \
    yarn link @bitgo/sdk-coin-avaxp && \
    yarn link @bitgo/sdk-coin-cspr && \
    yarn link @bitgo/sdk-coin-eth && \
    yarn link @bitgo/sdk-coin-stx && \
    yarn link @bitgo/sdk-coin-xtz && \
    yarn link @bitgo/abstract-utxo && \
    yarn link @bitgo/blockapis && \
    yarn link @bitgo/sdk-coin-ada && \
    yarn link @bitgo/sdk-coin-bch && \
    yarn link @bitgo/sdk-coin-bcha && \
    yarn link @bitgo/sdk-coin-bsv && \
    yarn link @bitgo/sdk-coin-btc && \
    yarn link @bitgo/sdk-coin-btg && \
    yarn link @bitgo/sdk-coin-celo && \
    yarn link @bitgo/sdk-coin-dash && \
    yarn link @bitgo/sdk-coin-ltc && \
    yarn link @bitgo/sdk-coin-rbtc && \
    yarn link @bitgo/sdk-coin-xrp && \
    yarn link @bitgo/sdk-coin-zec
#LINK_END

USER node
ENV NODE_ENV production
ENV BITGO_BIND 0.0.0.0
EXPOSE 3080
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/node", "/var/bitgo-express/bin/bitgo-express"]
