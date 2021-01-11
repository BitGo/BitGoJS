FROM node:10-alpine AS builder
MAINTAINER Tyler Levine <tyler@bitgo.com>
RUN apk add --no-cache git python make g++
COPY --chown=node:node . /tmp/bitgo/
WORKDIR /tmp/bitgo/modules/express
RUN npm install npm@latest -g
USER node
RUN npm ci && npm prune --production
FROM node:10-alpine
RUN apk add --no-cache tini gcompat
COPY --from=builder /tmp/bitgo/modules/express /var/bitgo-express
ENV NODE_ENV production
ENV BITGO_BIND 0.0.0.0
EXPOSE 3080
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/node", "/var/bitgo-express/bin/bitgo-express"]
