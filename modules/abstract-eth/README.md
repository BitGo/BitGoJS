# BitGo abstract-eth

## EVM TSS transaction verification

`verifyTssTransaction` decodes the EVM bytes about to be signed and compares `to` / `value` /
`data` with the user intent before the user key share signs (TOB-BITGOEDMPC-2 / INFOSEC-671).

- The caller's own `txParams` are authoritative whenever they declare `type` or `recipients`. A
  stored tx request intent is consulted only when the caller declared nothing (pending-approval
  signing); server data never fills absent caller calldata or replaces the declared token.
- The asset is resolved locally from the recipient's `tokenAddress` / `tokenName`, the top-level
  `tokenName` and the coin instance. Unresolvable or contradictory identity fails closed, and the
  calldata shape must match the asset: a native send, an ERC-20 / ERC-7984 transfer, or one batch
  that moves a single asset with the matching batch method.
- The bytes are decoded once, each check returns findings, and one policy step decides warn or
  throw. Fatal findings (native destination and value, ERC-20 recipient and amount, and the
  consolidation target when `consolidationToBaseAddress` is set) always throw. Every other
  finding is reported through `console.warn` and the optional `onVerificationWarning` callback;
  pass `strictTssVerification: true` to `BitGoAPI` to make them hard failures.
- A consolidation must pay the wallet base address, and an ERC-20 consolidation must not carry
  native value.
- `contractCall` and `customTx` intents always throw on EVM, and stored `defi-redeem` intents
  are rejected because no handler exists for them yet.
