#!/bin/bash

# Verify a BitGo Express image cannot validate TLS chains rooted in eMudhra
# (October 2026 CA compromise): the system CA bundle carries no eMudhra/emSign
# trust, and TLS verification follows that bundle rather than Node's embedded
# root store.
#
# Usage: scripts/verify-express-image-trust.sh <image>

set -euo pipefail

IMAGE="${1:?usage: verify-express-image-trust.sh <image>}"

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Verifying CA trust configuration of $IMAGE"

# The system CA bundle must exist and contain certificates.
if ! docker run --rm --entrypoint /bin/sh "$IMAGE" -c \
  'test -s /etc/ssl/certs/ca-certificates.crt && grep -q "BEGIN CERTIFICATE" /etc/ssl/certs/ca-certificates.crt'; then
  echo "::error::missing or empty /etc/ssl/certs/ca-certificates.crt in $IMAGE"
  exit 1
fi

# The system bundle must carry no eMudhra/emSign trust. Node's embedded root
# store is reported but only matters when the runtime consults it, which the
# probes below assert it does not.
docker run --rm --entrypoint /usr/local/bin/node "$IMAGE" -e '
  const fs = require("fs");
  const tls = require("tls");
  const { X509Certificate } = require("crypto");
  const pem = fs.readFileSync("/etc/ssl/certs/ca-certificates.crt", "utf8");
  const blocks = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  const compromised = (x509) => /emudhra|emsign/i.test(`${x509.subject}\n${x509.issuer}`);
  const embedded = tls.rootCertificates.map((block) => new X509Certificate(block));
  console.log(`system bundle certs: ${blocks.length}, embedded roots: ${embedded.length}`);
  const hits = blocks.map((block) => new X509Certificate(block)).filter(compromised);
  if (hits.length > 0) {
    console.error(`eMudhra/emSign trust found in the system bundle:\n${hits.map((x509) => x509.subject).join("\n")}`);
    process.exit(1);
  }
  const embeddedHits = embedded.filter(compromised);
  if (embeddedHits.length > 0) {
    console.log(`note: Node embedded root store lists ${embeddedHits.length} eMudhra/emSign root(s); NODE_OPTIONS=--use-openssl-ca keeps them out of TLS verification (asserted by the probes below)`);
  }
'

# TLS verification must follow the configured system bundle. A server whose
# chain is anchored in a throwaway probe CA is accepted only when that CA is in
# the bundle Node validates against; Node's embedded roots alone reject it.
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \
  -keyout "$WORK_DIR/probe-ca.key" -out "$WORK_DIR/probe-ca.crt" -days 1 \
  -subj "/CN=Express Trust Probe CA"
openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \
  -keyout "$WORK_DIR/probe-leaf.key" -out "$WORK_DIR/probe-leaf.csr" \
  -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
openssl x509 -req -in "$WORK_DIR/probe-leaf.csr" \
  -CA "$WORK_DIR/probe-ca.crt" -CAkey "$WORK_DIR/probe-ca.key" -CAcreateserial \
  -out "$WORK_DIR/probe-leaf.crt" -days 1 -copy_extensions copy

PROBE_JS='
const fs = require("fs");
const tls = require("tls");
if (process.env.PROBE_CA) {
  fs.writeFileSync("/tmp/probe-bundle.pem", process.env.PROBE_CA);
}
const server = tls.createServer(
  { key: process.env.PROBE_KEY, cert: process.env.PROBE_LEAF },
  (socket) => socket.end("ok")
);
server.listen(0, "127.0.0.1", () => {
  const socket = tls.connect(
    { host: "127.0.0.1", port: server.address().port, servername: "localhost", rejectUnauthorized: true },
    () => {
      console.log("ACCEPTED");
      socket.end();
      server.close();
    }
  );
  socket.on("error", (err) => {
    console.log(`REJECTED ${err.code || err.message}`);
    server.close();
    process.exitCode = 2;
  });
});
'

LEAF_KEY=$(cat "$WORK_DIR/probe-leaf.key")
LEAF_CERT=$(cat "$WORK_DIR/probe-leaf.crt")
PROBE_CA=$(cat "$WORK_DIR/probe-ca.crt")

echo "Probe CA present in configured bundle -> chain must verify:"
printf '%s' "$PROBE_JS" | docker run -i --rm \
  -e PROBE_KEY="$LEAF_KEY" -e PROBE_LEAF="$LEAF_CERT" -e PROBE_CA="$PROBE_CA" \
  -e SSL_CERT_FILE=/tmp/probe-bundle.pem \
  --entrypoint /usr/local/bin/node "$IMAGE" - > "$WORK_DIR/accept.log" 2>&1 || true
cat "$WORK_DIR/accept.log"
if ! grep -q '^ACCEPTED' "$WORK_DIR/accept.log"; then
  echo "::error::TLS verification does not follow the system CA store in $IMAGE"
  exit 1
fi

echo "Probe CA absent from configured bundle -> chain must be rejected:"
printf '%s' "$PROBE_JS" | docker run -i --rm \
  -e PROBE_KEY="$LEAF_KEY" -e PROBE_LEAF="$LEAF_CERT" \
  --entrypoint /usr/local/bin/node "$IMAGE" - > "$WORK_DIR/reject.log" 2>&1 || true
cat "$WORK_DIR/reject.log"
if ! grep -q '^REJECTED' "$WORK_DIR/reject.log"; then
  echo "::error::untrusted probe CA was accepted via the default bundle in $IMAGE"
  exit 1
fi

echo "✅ CA trust verification passed for $IMAGE"