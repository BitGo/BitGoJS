FROM node:14-alpine@sha256:5c33bc6f021453ae2e393e6e20650a4df0a4737b1882d389f17069dc1933fdc5 AS builder
MAINTAINER Tyler Levine <tyler@bitgo.com>
RUN apk add --no-cache git python make g++ libtool autoconf automake
COPY --chown=node:node . /tmp/bitgo/
WORKDIR /tmp/bitgo/modules/express
USER node
RUN \
    # install with dev deps so we can run the prepare script
    yarn install --frozen-lockfile && \
    # install again to prune dev deps
    yarn install --production --frozen-lockfile
FROM node:14-alpine@sha256:5c33bc6f021453ae2e393e6e20650a4df0a4737b1882d389f17069dc1933fdc5
RUN apk add --no-cache tini
COPY --from=builder \
    /tmp/bitgo/modules/express/LICENSE \
    /tmp/bitgo/modules/express/README.md \
    /tmp/bitgo/modules/express/RELEASE_NOTES.md \
    /tmp/bitgo/modules/express/package.json \
    /var/bitgo-express/
# copy both the root node_modules and the express module node_modules to the final node_modules directory
COPY --from=builder /tmp/bitgo/node_modules /tmp/bitgo/modules/express/node_modules /var/bitgo-express/node_modules/
# copy individual directories that contain js executable files, source and compiled js
COPY --from=builder /tmp/bitgo/modules/express/bin /var/bitgo-express/bin/
COPY --from=builder /tmp/bitgo/modules/express/dist /var/bitgo-express/dist/
COPY --from=builder /tmp/bitgo/modules/express/src /var/bitgo-express/src/
ENV NODE_ENV production
ENV BITGO_BIND 0.0.0.0
EXPOSE 3080
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/node", "/var/bitgo-express/bin/bitgo-express"]
