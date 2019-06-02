FROM node:lts AS builder
MAINTAINER Tyler Levine <tyler@bitgo.com>
COPY --chown=node:node . /tmp/bitgo/
WORKDIR /tmp/bitgo/modules/express
USER node
RUN npm ci && npm prune --production
FROM node:lts-alpine
RUN apk add --no-cache tini
COPY --from=builder /tmp/bitgo/modules/express /var/bitgo-express
ENTRYPOINT ["/sbin/tini", "--"]
ENV NODE_ENV production
EXPOSE 3080
CMD [ "/usr/local/bin/node", "/var/bitgo-express/bin/bitgo-express", "-b", "0.0.0.0" ]
