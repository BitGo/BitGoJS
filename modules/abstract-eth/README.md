# BitGo abstract-eth

## EVM TSS transaction verification

`verifyTssTransaction` decodes the EVM bytes about to be signed and compares `to` / `value` /
`data` with the declared intent before the user key share signs (TOB-BITGOEDMPC-2 / INFOSEC-671).
The default rollout reports new mismatches without blocking signing; it is not full fail-closed
enforcement. Set `strictTssVerification: true` locally on `BitGoAPI` to reject every finding.

- The caller's own `txParams` are authoritative whenever they declare `type` or `recipients`. A
  stored tx request intent is consulted only when the caller declared nothing (pending-approval
  signing); server data never fills absent caller calldata or replaces the declared token.
- Token identity comes from the recipient's `tokenAddress` / `tokenName` and
  `tokenData.tokenContractAddress` / `tokenData.tokenName`, the top-level `tokenName`, and the
  coin instance. Conflicting or unresolvable declarations produce a finding. For declared NFTs,
  a registered generic placeholder name of the same standard is display metadata only when an
  explicit collection address is present; real collection names must still agree. Payment shapes
  include native, ERC-20 / ERC-7984, and single-asset batch transfers. Calldata comparisons
  canonicalize the hex prefix, case, and empty values.
- Missing or undecodable transaction bytes and caller-declared `transfer` / `payment` /
  `transferToken` without recipients always reject, in either mode. Historic destination,
  value, ERC-20 recipient and amount checks, plus `consolidationToBaseAddress`, remain fatal.
- Other findings go to `console.warn` and the optional `onVerificationWarning` callback in
  default mode. Console reason text is bounded, and structured calldata fields show only the
  selector and original length; this is not a guarantee of secret-free logs. The callback receives
  full fields. Callback throws and rejected promises do not abort or delay signing.
  Strict mode rejects the first finding, including unsupported operations such as acceleration,
  staking, wrap/unwrap, token enablement, and bridging; it never downgrades them to warnings.
- A consolidation must pay the wallet base address, and an ERC-20 consolidation must not carry
  native value.
- `transferToken` supports ERC-721 and ERC-1155 when `tokenData` declares the standard,
  collection, token ID, and ERC-1155 quantity. Verification checks the collection contract, zero
  native value, decoded recipient, token ID, and quantity. ERC-1155 batch calldata must contain
  exactly the single declared entry. NFT sends declaring raw calldata use exact-call verification.
- FLR MPCv2 C-chain-to-P-chain atomic exports use atomic decoding, not EVM decoding. They require
  a declared export intent, decoded C-chain source and P-chain destination, one matching P-chain
  recipient address set, and an exported nanoFLR amount equal to the declared wei amount converted
  to nanoFLR plus an import fee within the network's configured minimum/maximum bounds. These
  checks reject in either verification mode. Atomic imports still reach the parent EVM decoder
  and reject; this export-specific path does not restore import signing.
- `fillNonce` must send exactly 1 wei with no calldata to the declared `receiveAddress`, or to
  the wallet base address when none is declared. Stored intents supply this address only when
  the caller declared no intent of its own.
- `contractCall` and `customTx` always reject on EVM. Stored DeFi approve/deposit/withdraw
  intents also reject: there is no locally trusted vault registry to bind the target or spender.
  Stored `defi-redeem` remains unsupported. Caller-declared DeFi legs retain selector, amount,
  and receiver/owner checks and reject native value; token-wallet approvals also bind the token
  contract. These checks do not establish the vault's identity or the approval spender.
