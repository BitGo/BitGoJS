# web-demo

Reference UI for integrating the BitGo SDK in the browser. Routes mirror problems solved in production apps (**bitgo-retail**, **bitgo-ui**) using SDK packages directly — no private `@bitgo-private/*` dependencies.

## Quick start

From the BitGoJS repo root (after `yarn install`):

```bash
cd modules/web-demo
yarn dev
```

Opens [localhost:8080](http://localhost:8080).

## Consumer config matrix

Production apps bundle the SDK differently. web-demo will support **consumer profiles** (via `CONSUMER_PROFILE` env) so each profile documents one real-world setup. Profiles are added incrementally; only `classic-webpack` is active today.

| Profile | Status | Mirrors | Bundler | WASM | SDK auth |
| --- | --- | --- | --- | --- | --- |
| `classic-webpack` | **active** (default) | bitgo-ui classic app, default web-demo | Webpack + [`webpack/bitgojs.config.js`](../../webpack/bitgojs.config.js) | Partial ESM aliases in shared config | Access token or `/webcrypto-auth` |
| `retail-browser` | planned | bitgo-retail web (`MOBILE_MODE` off) | Webpack profile | Full `@bitgo/wasm-*` ESM paths, DKLS/cardano browser swaps | `WebCryptoHmacStrategy` + `requestIdPrefix` |
| `retail-mobile-stub` | planned | bitgo-retail mobile webview | Webpack profile | Empty WASM shims (no heavy signing WASM) | Bridge / token (documented only) |
| `direct-sdk` | planned | bitgo-retail mock server, `examples/ts` | Either | Per profile | `BitGoAPI` + `customRootURI`, no Express |
| `express-proxy` | planned | Self-hosted Express users | Either | Per profile | Local Express signing proxy |

**Planned usage** (not wired yet):

```bash
yarn dev                                          # classic-webpack
CONSUMER_PROFILE=retail-browser yarn dev          # future
CONSUMER_PROFILE=retail-mobile-stub yarn dev      # future
```

### What each production app solved

| Problem | bitgo-retail | bitgo-ui | web-demo route |
| --- | --- | --- | --- |
| Browser WASM loading | Vite ESM aliases for `@bitgo/wasm-utxo`, `wasm-ton`, `wasm-mps` | Webpack aliases (similar) | `/wasm-miniscript` |
| HMAC without raw token in storage | `WebCryptoHmacStrategy` + IndexedDB | Classic token flow | `/webcrypto-auth` |
| Passkey PRF wallet flows | `@bitgo-private/web-client` (retail); SDK: `@bitgo/passkey-crypto` | Partial | `/passkey-demo` |
| Keycard generation | `@bitgo/key-card` in wallet create / migration | Keycard flows | `/keycard` |
| Lazy coin registration | `retail-sdk-client/coinFactory` | `~/utils/coinFactory` | `/coins` |
| Token enable prebuild | React Query + `PrebuildTransactionResult` | `useBuildTokenEnablementMutation` | planned `/token-enable` |

## Demo routes

| Path | Description |
| --- | --- |
| `/` | Home |
| `/bitgo-js` | BitGo SDK object inspect |
| `/bitgo-api` | BitGoAPI usage |
| `/coins` | Coin factory / registration |
| `/keycard` | Keycard download fixtures |
| `/wasm-miniscript` | WASM miniscript smoke |
| `/ecdsachallenge` | ECDSA challenge generation |
| `/webcrypto-auth` | WebCrypto HMAC strategy + IndexedDB session |
| `/passkey-demo` | Passkey register / attach / wallet (uses `@bitgo/passkey-crypto`) |

## Contributing

Owned by **@BitGo/web-experience** (`CODEOWNERS`). Prefer small PRs: one profile, one route, or one README section at a time. See the local BitGoJS side-improvements plan for micro-PR sizing.
