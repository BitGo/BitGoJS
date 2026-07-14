# HSM-447 — BIP32-Ed25519 derivation spike: validation scripts

Executable evidence backing the [HSM-447](https://linear.app/bitgo/issue/HSM-447) design note
(ed25519 hardened + non-hardened child derivation for root-④ safe wallets: ALGO / XLM / HBAR).

> **This is a throwaway spike branch, not for merge.** These scripts exist so reviewers can read and
> re-run the proofs cited in the design note. They validate the *existing* `Ed25519Bip32HdTree` in
> `@bitgo/sdk-lib-mpc` and a proposed scalar signer — they are not production code.

## Prerequisites

Run from this directory after a normal repo build (the scripts require the built `dist/` of
`modules/sdk-lib-mpc` and packages from the repo-root `node_modules`):

```bash
yarn && yarn build          # from repo root, if not already built
cd spikes/hsm447-ed25519-derivation
node i3-normative.cjs        # etc.
```

All paths are relative to this directory (anchored on `__dirname`), so the scripts are portable
within a clone.

## What each script proves

| Script | Claim it backs (design-note ref) | Run | Expected signal |
|---|---|---|---|
| **`i3-normative.cjs`** | Authoritative spec. Root gen (P1), byte-order/nonce (P2), key-bundle format (P4). Derives with the SDK **and** an independent `@noble/curves` implementation and cross-checks pub/sig. | `node i3-normative.cjs` | `P1/P2/P4: VALIDATED`; regenerates `i3-normative-vectors.json`. See note on "DIVERGENCE" below. |
| **`i3-normative-vectors.json`** | The cross-stack test-vector contract (HSM · wallet-platform · BitGoJS must reproduce these). | (data file) | byte-level intermediates per path |
| **`hh-vector.cjs`** | **mod-L reduction lock (P2b).** At a consecutive-hardened path `m/0'/1'` the reduced (our SDK) and unreduced (paper) conventions produce **different pubkeys** — so the convention must be pinned. | `node hh-vector.cjs` | SDK pub `d9e39714…7481` == reduced impl; unreduced impl `660a6728…560d` (different) |
| **`seed-guard-fresh.cjs`** | **Seed-decoder hazard.** A bare 32-byte scalar hex silently passes `isValidEd25519Seed` and yields the **wrong** pubkey via `fromSeed`; the P4 JSON bundle does not. Motivates the `isP4Bundle` guards. | `node seed-guard-fresh.cjs` | `C7 CONFIRMED`, `C8 CONFIRMED` |
| **`verify.mjs`** | Non-hardened pub/priv derive consistency at depth 1–2 (`publicDerive.pk == privateDerive.pk == sk·G`); `pathToIndices` apostrophe bug; `order()` returns 8·L bug. | `node verify.mjs` | consistency `YES`; `pathToIndices("m/0'") = [0]` (bug); `order() == 8*l: YES` |
| **`verify2.mjs`** | Hardened vs non-hardened at the same index produce different keys; hardened requires the raw numeric index (apostrophe not honored). | `node verify2.mjs` | hardened ≠ non-hardened pub |
| **`scalar-sign-test.mjs`** | The **scalar signer** (`r = SHA512(kR‖m) mod L; R = r·B; S = (r + H(R‖A‖m)·kL) mod L`) produces signatures that verify under tweetnacl and libsodium for derived keys. | `node scalar-sign-test.mjs` | `verify: true` |
| `round1-poc/` | Round-1 proof-of-concept (E1–E6): derive-consistency, scalar signing, address formation. **Its `test-vectors.json` used LE nonce bytes and is VOID** — superseded by `i3-normative-vectors.json`. Kept for provenance. | — | (superseded) |
| `round1-redteam/` | Round-1 adversarial scripts that found the LE/BE byte-order bug (`attack*.js`) and probed the non-hardened parent-recovery leak (`red-team-dh.cjs`). | — | attack demonstrations |

### On the "DIVERGENCE DETECTED" line in `i3-normative.cjs`

The cross-validation reports `allSkMatch: false` while **`allPkMatch`, `allSigMatch`, and all verify
checks are `true`**. This is expected and benign: the SDK and the `@noble` implementation serialize
the child scalar with different representations that are **congruent mod L** — they encode the *same*
scalar, hence identical pubkeys and identical signatures. The scalar is what matters for signing; the
byte encoding is fixed normatively by P4 (`sk` = 32-byte LE, reduced mod L). No pubkey or signature
ever diverges.

## Mapping to the required code fixes (design note §10)

- `pathToIndices` silent non-hardened fallback → `verify.mjs`
- mod-L reduction must stay + be pinned → `hh-vector.cjs`
- scalar signer needed (children are scalars, not seeds) → `scalar-sign-test.mjs`, `i3-normative.cjs`
- `isP4Bundle` guards → `seed-guard-fresh.cjs`
- `Ed25519Curve.order()` returns 8·L → `verify.mjs`
