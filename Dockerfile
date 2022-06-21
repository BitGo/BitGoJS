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
    yarn install --production --frozen-lockfile --non-interactive --ignore-scripts

FROM node:16-alpine@sha256:72a490e7ed8aed68e16b8dc8f37b5bcc35c5b5c56ee3256effcdee63e2546f93
RUN apk add --no-cache tini
COPY --from=builder \
    /tmp/bitgo/modules/express/LICENSE \
    /tmp/bitgo/modules/express/README.md \
    /tmp/bitgo/modules/express/RELEASE_NOTES.md \
    /tmp/bitgo/modules/express/package.json \
    /var/bitgo-express/

# copy the root node_modules to the bitgo-express parent node_modules
COPY --from=builder /tmp/bitgo/node_modules  /var/node_modules/

# copy the express module node_modules to the final node_modules directory
COPY --from=builder /tmp/bitgo/modules/express/node_modules /var/bitgo-express/node_modules/

# copy individual directories that contain js executable files, and compiled js
COPY --from=builder /tmp/bitgo/modules/express/bin /var/bitgo-express/bin/
COPY --from=builder /tmp/bitgo/modules/express/dist /var/bitgo-express/dist/

# copy bitgo and yarn link it
COPY --from=builder /tmp/bitgo/modules/bitgo/package.json /var/modules/bitgo/
COPY --from=builder /tmp/bitgo/modules/bitgo/dist /var/modules/bitgo/dist/
COPY --from=builder /tmp/bitgo/modules/bitgo/node_modules /var/modules/bitgo/node_modules/
RUN cd /var/modules/bitgo && yarn link

# copy bitgo dependencies
# copy abstract-eth and yarn link it
COPY --from=builder /tmp/bitgo/modules/abstract-eth/package.json /var/modules/abstract-eth/
COPY --from=builder /tmp/bitgo/modules/abstract-eth/dist /var/modules/abstract-eth/dist/
COPY --from=builder /tmp/bitgo/modules/abstract-eth/node_modules /var/modules/abstract-eth/node_modules/
RUN cd /var/modules/abstract-eth && yarn link

# copy abstract-utxo and yarn link it
COPY --from=builder /tmp/bitgo/modules/abstract-utxo/package.json /var/modules/abstract-utxo/
COPY --from=builder /tmp/bitgo/modules/abstract-utxo/dist /var/modules/abstract-utxo/dist/
RUN cd /var/modules/abstract-utxo && yarn link

# copy account-lib and yarn link it
COPY --from=builder /tmp/bitgo/modules/account-lib/package.json /var/modules/account-lib/
COPY --from=builder /tmp/bitgo/modules/account-lib/dist /var/modules/account-lib/dist/
COPY --from=builder /tmp/bitgo/modules/account-lib/node_modules /var/modules/account-lib/node_modules/
RUN cd /var/modules/account-lib && yarn link

# copy blake2b and yarn link it
COPY --from=builder /tmp/bitgo/modules/blake2b/package.json /var/modules/blake2b/
COPY --from=builder /tmp/bitgo/modules/blake2b/index.js /var/modules/blake2b/
COPY --from=builder /tmp/bitgo/modules/blake2b/node_modules /var/modules/blake2b/node_modules/
RUN cd /var/modules/blake2b && yarn link

# copy blake2b-wasm and yarn link it
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm/package.json /var/modules/blake2b-wasm/
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm/blake2b.js /var/modules/blake2b-wasm/
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm/blake2b.wasm /var/modules/blake2b-wasm/
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm/blake2b.wat /var/modules/blake2b-wasm/
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm/generate-rounds.js /var/modules/blake2b-wasm/
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm/index.js /var/modules/blake2b-wasm/
COPY --from=builder /tmp/bitgo/modules/blake2b-wasm/node_modules /var/modules/blake2b-wasm/node_modules
RUN cd /var/modules/blake2b-wasm && yarn link

# copy blockapis and yarn link it
COPY --from=builder /tmp/bitgo/modules/blockapis/package.json /var/modules/blockapis/
COPY --from=builder /tmp/bitgo/modules/blockapis/dist /var/modules/blockapis/dist/
COPY --from=builder /tmp/bitgo/modules/blockapis/node_modules /var/modules/blockapis/node_modules/
RUN cd /var/modules/blockapis && yarn link

# copy bls-dkg and yarn link it
COPY --from=builder /tmp/bitgo/modules/bls-dkg/package.json /var/modules/bls-dkg/
COPY --from=builder /tmp/bitgo/modules/bls-dkg/index.js /var/modules/bls-dkg/
RUN cd /var/modules/bls-dkg && yarn link

# copy sdk-api and yarn link it
COPY --from=builder /tmp/bitgo/modules/sdk-api/package.json /var/modules/sdk-api/
COPY --from=builder /tmp/bitgo/modules/sdk-api/dist /var/modules/sdk-api/dist/
COPY --from=builder /tmp/bitgo/modules/sdk-api/node_modules /var/modules/sdk-api/node_modules/
RUN cd /var/modules/sdk-api && yarn link

# copy sdk-coin-algo and yarn link it
COPY --from=builder /tmp/bitgo/modules/sdk-coin-algo/package.json /var/modules/sdk-coin-algo/
COPY --from=builder /tmp/bitgo/modules/sdk-coin-algo/dist /var/modules/sdk-coin-algo/dist/
RUN cd /var/modules/sdk-coin-algo && yarn link

# copy sdk-coin-avaxp and yarn link it
COPY --from=builder /tmp/bitgo/modules/sdk-coin-avaxp/package.json /var/modules/sdk-coin-avaxp/
COPY --from=builder /tmp/bitgo/modules/sdk-coin-avaxp/dist /var/modules/sdk-coin-avaxp/dist/
COPY --from=builder /tmp/bitgo/modules/sdk-coin-avaxp/node_modules /var/modules/sdk-coin-avaxp/node_modules/
RUN cd /var/modules/sdk-coin-avaxp && yarn link

# copy sdk-coin-cspr and yarn link it
COPY --from=builder /tmp/bitgo/modules/sdk-coin-cspr/package.json /var/modules/sdk-coin-cspr/
COPY --from=builder /tmp/bitgo/modules/sdk-coin-cspr/dist /var/modules/sdk-coin-cspr/dist/
COPY --from=builder /tmp/bitgo/modules/sdk-coin-cspr/node_modules /var/modules/sdk-coin-cspr/node_modules/
RUN cd /var/modules/sdk-coin-cspr && yarn link

# copy sdk-coin-xrp and yarn link it
COPY --from=builder /tmp/bitgo/modules/sdk-coin-xrp/package.json /var/modules/sdk-coin-xrp/
COPY --from=builder /tmp/bitgo/modules/sdk-coin-xrp/dist /var/modules/sdk-coin-xrp/dist/
COPY --from=builder /tmp/bitgo/modules/sdk-coin-xrp/node_modules /var/modules/sdk-coin-xrp/node_modules/
RUN cd /var/modules/sdk-coin-xrp && yarn link

# copy sdk-core and yarn link it
COPY --from=builder /tmp/bitgo/modules/sdk-core/package.json /var/modules/sdk-core/
COPY --from=builder /tmp/bitgo/modules/sdk-core/dist /var/modules/sdk-core/dist/
COPY --from=builder /tmp/bitgo/modules/sdk-core/node_modules /var/modules/sdk-core/node_modules/
RUN cd /var/modules/sdk-core && yarn link

# copy sjcl and yarn link it
COPY --from=builder /tmp/bitgo/modules/sjcl/package.json /var/modules/sjcl/
COPY --from=builder /tmp/bitgo/modules/sjcl/sjcl.min.js /var/modules/sjcl/
RUN cd /var/modules/sjcl && yarn link

# copy statics and yarn link it
COPY --from=builder /tmp/bitgo/modules/statics/package.json /var/modules/statics/
COPY --from=builder /tmp/bitgo/modules/statics/dist /var/modules/statics/dist/
COPY --from=builder /tmp/bitgo/modules/statics/node_modules /var/modules/statics/node_modules/
RUN cd /var/modules/statics && yarn link

# copy unspents and yarn link it
COPY --from=builder /tmp/bitgo/modules/unspents/package.json /var/modules/unspents/
COPY --from=builder /tmp/bitgo/modules/unspents/dist /var/modules/unspents/dist/
COPY --from=builder /tmp/bitgo/modules/unspents/node_modules /var/modules/unspents/node_modules/
RUN cd /var/modules/unspents && yarn link

# copy utxo-lib and yarn link it
COPY --from=builder /tmp/bitgo/modules/utxo-lib/package.json /var/modules/utxo-lib/
COPY --from=builder /tmp/bitgo/modules/utxo-lib/dist /var/modules/utxo-lib/dist/
COPY --from=builder /tmp/bitgo/modules/utxo-lib/node_modules /var/modules/utxo-lib/node_modules/
RUN cd /var/modules/utxo-lib && yarn link

# yarn link all required packages in bitgo-express
RUN \
    cd /var/bitgo-express && \
    yarn link bitgo && \
    yarn link @bitgo/abstract-eth && \
    yarn link @bitgo/abstract-utxo && \
    yarn link @bitgo/account-lib && \
    yarn link @bitgo/blake2b && \
    yarn link @bitgo/blake2b-wasm && \
    yarn link @bitgo/blockapis && \
    yarn link @bitgo/bls-dkg && \
    yarn link @bitgo/sdk-api && \
    yarn link @bitgo/sdk-coin-algo && \
    yarn link @bitgo/sdk-coin-avaxp && \
    yarn link @bitgo/sdk-coin-cspr && \
    yarn link @bitgo/sdk-coin-xrp && \
    yarn link @bitgo/sdk-core && \
    yarn link @bitgo/sjcl && \
    yarn link @bitgo/statics && \
    yarn link @bitgo/unspents && \
    yarn link @bitgo/utxo-lib

USER node
ENV NODE_ENV production
ENV BITGO_BIND 0.0.0.0
EXPOSE 3080
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/node", "/var/bitgo-express/bin/bitgo-express"]
