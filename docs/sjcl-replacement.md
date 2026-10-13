# SJCL Replacement — v1 Decrypt Boundary

Part of the SJCL deprecation effort ([WCN-43](https://linear.app/bitgo/issue/WCN-43/big-23-003-wp1-unmaintained-cryptographic-library), [WCN-1067](https://linear.app/bitgo/issue/WCN-1067/big-26-004-deprecated-cryptographic-library-utilized-sjcl)). This document states precisely where each crypto engine runs for local encrypt/decrypt, and why the browser v1 path intentionally still uses SJCL.

## Current boundary

| Envelope                              | Node runtime                                                                  | Browser / worker runtime                                   |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| v1 (SJCL PBKDF2-SHA256 + AES-256-CCM) | Native `node:crypto` AES-CCM (`decryptV1`), with SJCL as a rollout safety net | Frozen `@bitgo/sjcl` decoder, straight — no native attempt |
| v2 (Argon2id + AES-256-GCM)           | Argon2id + WebCrypto AES-GCM (`encryptV2`/`decryptV2`)                        | Argon2id + WebCrypto AES-GCM — identical code              |

- **Node v1**: `decryptV1WithFallback` tries `decryptV1` (native `node:crypto` `aes-*-ccm`) first. Any native failure falls through to `sjcl.decrypt` so callers are never blocked during rollout; only an iter-cap violation is rethrown. A `console.warn` fires only when the two engines disagree (native fails, SJCL succeeds).
- **Browser/worker v1**: `isBrowserRuntime()` (true when `window` or `self` exists) routes `decryptV1WithFallback` straight to `sjcl.decrypt`. Before handing over, it runs the same `parseV1Envelope` envelope check the native path uses, rethrowing only iter-cap violations to preserve DoS protection; any other shape rejection (e.g. a legacy envelope without a `v` field) is a form SJCL still accepts and is left to SJCL to decide. The native attempt is skipped entirely: webpack substitutes `crypto-browserify` (backed by `browserify-aes`) for `node:crypto` in browser bundles, and its AES-CCM does not work, so the attempt would only pay for a doomed PBKDF2 run before falling back.
- **v2 everywhere**: v2 is Argon2id + WebCrypto AES-GCM in both Node and browser bundles; it never touches SJCL.

The same boundary is enforced by tests: Node behavior in `modules/sdk-api/test/unit/decryptV1.ts`, and real-browser dispatch (including the absent-`v` and iter-cap boundary cases) by the Cypress component spec `modules/web-demo/src/components/BitGoAPI/decrypt.spec.tsx`.

## Why there is no WebCrypto CCM implementation for browser v1

An alternative was considered: replace the SJCL decoder with a hand-written WebCrypto composition. It was rejected:

- WebCrypto has **no AES-CCM primitive**. A replacement would have to be hand-assembled from AES-CTR/CBC plus manual CCM formatting — i.e. brand-new, unreviewed cryptographic code.
- The threat model is local self-decrypt of the user's own envelope; there is no real security benefit to offset the risk of new crypto.
- It would not remove the `@bitgo/sjcl` dependency anyway: `encryptV1` and the `eddsaMPCv2` fallback still use SJCL (tracked as follow-up work).

Instead, `@bitgo/sjcl` is kept as a frozen, decrypt-only shim for browser v1, scoped to the SJCL envelope format and iteration-capped via `V1_MAX_ITER` (`100_000`, 10x the 10,000 iterations BitGo-produced envelopes use).

## Remaining SJCL surface (follow-ups)

- `encryptV1` — v1 encryption is legacy; still calls `sjcl.encrypt`.
- `eddsaMPCv2` — retains an SJCL fallback path.

These are intentionally out of scope of the browser v1 decrypt routing work.
