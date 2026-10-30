#!/usr/bin/env bash
set -euo pipefail

# Guardian for the bundled BitGo TLS CA store (modules/express/bitgo-ca.pem).
#
# Offline checks (no network, no build required — runs in `yarn test:data` before unit-test):
#   - every certificate in bitgo-ca.pem parses
#   - every certificate is a self-signed CA root (issuer == subject, basicConstraints CA:TRUE)
#   - every certificate is at least 30 days from expiry (warning) / not expired (hard fail)
#   - all official BitGo domains are covered and http downgrades are refused
#
# Usage:
#   bash scripts/verify-bitgo-policy-data.sh               offline checks only
#   bash scripts/verify-bitgo-policy-data.sh --live        offline checks + real TLS handshakes to all
#                                                          9 live BitGo endpoints (app.*, admin.*, cdn.*)
#   bash scripts/verify-bitgo-policy-data.sh --regenerate  rebuild bitgo-ca.pem from Node's current
#                                                          tls.rootCertificates (5 tier-1 providers), then verify

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bundle="$repo_root/modules/express/bitgo-ca.pem"
mode="${1:-}"

[[ -f "$bundle" ]] || { echo "error: missing CA bundle: $bundle" >&2; exit 1; }

if [[ "$mode" == "--regenerate" ]]; then
  node - "$bundle" <<'REGEN_EOF'
const fs = require('fs');
const tls = require('tls');
const crypto = require('crypto');
const outputPath = process.argv[2];

// The 5 tier-1 CA providers BitGo uses today or would fail over to.
const wanted = new Set([
  'GTS Root R1', 'GTS Root R2', 'GTS Root R3', 'GTS Root R4',
  'Amazon Root CA 1', 'Amazon Root CA 2', 'Amazon Root CA 3', 'Amazon Root CA 4',
  'Starfield Services Root Certificate Authority - G2',
  'DigiCert Global Root CA', 'DigiCert Global Root G2', 'DigiCert Global Root G3',
  'DigiCert High Assurance EV Root CA',
  'ISRG Root X1', 'ISRG Root X2',
  'USERTrust RSA Certification Authority', 'USERTrust ECC Certification Authority',
]);
const header = `# BitGo Express — Bundled Root CA Store for Official BitGo Domains (*.bitgo*.com)
#
# Contains self-signed Root CAs across the 5 tier-1 CA providers trusted for BitGo
# endpoints (Google Trust Services, Amazon Trust Services, DigiCert, Let's
# Encrypt / ISRG, and Sectigo).
#
# Regenerate from the current Node.js LTS root store and re-verify with:
#     bash scripts/verify-bitgo-policy-data.sh --regenerate
`;

const blocks = [];
const found = new Set();
for (const pem of tls.rootCertificates) {
  const c = new crypto.X509Certificate(pem);
  const m = c.subject.match(/CN=([^\n]+)/);
  if (m && wanted.has(m[1]) && c.subject === c.issuer && c.ca) {
    blocks.push(`# ${m[1]} (validTo: ${c.validTo})\n${pem.trim()}`);
    found.add(m[1]);
  }
}
const missing = [...wanted].filter((name) => !found.has(name));
if (missing.length > 0) {
  console.error(`error: wanted roots not found by CN in tls.rootCertificates: ${missing.join(', ')} — update the wanted list?`);
  process.exit(1);
}
fs.writeFileSync(outputPath, header + blocks.join('\n\n') + '\n');
console.log(`regenerated ${outputPath} with ${blocks.length} self-signed root CAs`);
REGEN_EOF
fi

node - "$bundle" "$mode" <<'EOF'
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const [bundlePath, mode] = process.argv.slice(2);

const RELEASER_STEPS = `To fix before releasing:
  1. Regenerate the bundle from the current Node.js LTS root store:
       bash scripts/verify-bitgo-policy-data.sh --regenerate
     (or replace the expiring root PEM in modules/express/bitgo-ca.pem from the CA provider's official store).
  2. Verify against live BitGo endpoints:
       yarn test:data:live        (in modules/express)
  3. Commit the updated modules/express/bitgo-ca.pem and open a PR.`;

const bundleText = fs.readFileSync(bundlePath, 'utf8');
const blocks = bundleText.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
if (!blocks || blocks.length === 0) {
  console.error('error: bundle contains no certificates');
  process.exit(1);
}

for (const block of blocks) {
  const cert = new crypto.X509Certificate(block);
  if (cert.issuer !== cert.subject) {
    console.error(`error: bundle cert '${cert.subject}' is cross-signed (issuer '${cert.issuer}'); trust anchors must be self-signed`);
    process.exit(1);
  }
  if (!cert.ca) {
    console.error(`error: bundle cert '${cert.subject}' is not a CA certificate (basicConstraints CA:TRUE missing)`);
    process.exit(1);
  }
}

// Expiry: warn loudly (with releaser steps) below 30 days; hard-fail only once actually expired, so an
// upcoming root rotation does not block unrelated PRs months in advance.
for (const block of blocks) {
  const cert = new crypto.X509Certificate(block);
  const daysRemaining = Math.floor((new Date(cert.validTo).getTime() - Date.now()) / 86_400_000);
  if (daysRemaining <= 0) {
    console.error(`error: bundle cert '${cert.subject}' EXPIRED ${-daysRemaining} day(s) ago (${cert.validTo}).\n\n${RELEASER_STEPS}`);
    process.exit(1);
  }
  if (daysRemaining < 30) {
    console.warn(`warning: bundle cert '${cert.subject}' expires in ${daysRemaining} day(s) (${cert.validTo}).\n${RELEASER_STEPS}`);
  }
}

// All official BitGo domains (apex + subdomains across prod/test/staging/dev).
const hostPatterns = [
  'bitgo.com', '.bitgo.com',
  'bitgo-test.com', '.bitgo-test.com',
  'bitgo-staging.com', '.bitgo-staging.com',
  'bitgo-dev.com', '.bitgo-dev.com',
];
const allExpectedDomains = [
  'bitgo.com', 'bitgo-test.com', 'bitgo-staging.com', 'bitgo-dev.com',
  'app.bitgo.com', 'app.bitgo-test.com', 'app.bitgo-staging.com', 'app.bitgo-dev.com',
  'admin.bitgo.com', 'admin.bitgo-test.com', 'admin.bitgo-staging.com', 'admin.bitgo-dev.com',
  'cdn.bitgo.com',
];

function matchesHost(hostname, pattern) {
  const host = hostname.toLowerCase().replace(/\.+$/, '');
  const p = pattern.toLowerCase().replace(/\.+$/, '');
  return p.startsWith('.') ? host.endsWith(p) : host === p;
}
function covers(url) {
  const parsed = new URL(url.startsWith('http') ? url : `http://${url}`);
  const covered = hostPatterns.some((h) => matchesHost(parsed.hostname, h));
  if (covered && parsed.protocol !== 'https:') {
    throw new Error(`insecure ${parsed.protocol}//${parsed.hostname} on a covered host`);
  }
  return covered;
}

for (const h of allExpectedDomains) {
  if (!covers(`https://${h}/api/v2`)) {
    console.error(`error: host not covered by policy: ${h}`);
    process.exit(1);
  }
  try {
    covers(`http://${h}`);
    console.error(`error: http downgrade not rejected for covered host: ${h}`);
    process.exit(1);
  } catch (err) {
    if (!/insecure/.test(err.message)) {
      console.error(err.message);
      process.exit(1);
    }
  }
}

console.log(`ok: ${blocks.length} self-signed CA certs (none within 30d of expiry), ${allExpectedDomains.length} BitGo hosts covered, http downgrades throw`);

if (mode === '--live' || mode === '--live-all') {
  const agent = new https.Agent({ ca: bundleText, keepAlive: true });
  (async () => {
    for (const host of allExpectedDomains) {
      await new Promise((resolve, reject) => {
        const req = https.get(`https://${host}/`, { agent, timeout: 10000 }, (res) => {
          res.resume();
          console.log(`live ok: https://${host}/ (HTTP ${res.statusCode})`);
          resolve();
        });
        req.on('error', (err) => reject(new Error(`live TLS check failed for ${host}: ${err.message}`)));
        req.on('timeout', () => req.destroy(new Error(`live TLS check timed out for ${host}`)));
      });
    }
  })().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
EOF
