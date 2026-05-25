# Provenance

Vendored from [hash-wasm](https://github.com/Daninet/hash-wasm) v4.12.0.

- **npm**: `hash-wasm@4.12.0`
- **git**: `github.com/Daninet/hash-wasm` commit `373b796205ab55fb4a657374dad6ea589bf75815`
- **file**: `dist/argon2.umd.min.js` from the npm tarball

## SHA256

```
dcec617a2e1b700fa132d1583a186cb70611113395e869f2dd6cc82b415d3094  argon2.umd.min.js
```

## Verification

```bash
./scripts/verify-vendor.sh
```

Compares the local file against the npm tarball. To verify against the pinned hash:

```bash
echo "dcec617a2e1b700fa132d1583a186cb70611113395e869f2dd6cc82b415d3094  argon2.umd.min.js" | shasum -a 256 -c
```
