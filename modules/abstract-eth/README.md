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
  coin instance. Conflicting or unresolvable declarations produce a finding; no declaration
  silently overrides another. Payment shapes include native, ERC-20 / ERC-7984, and single-asset
  batch transfers. Calldata comparisons canonicalize the hex prefix, case, and empty values.
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
- `fillNonce` must send exactly 1 wei with no calldata to the declared `receiveAddress`, or to
  the wallet base address when none is declared. Stored intents supply this address only when
  the caller declared no intent of its own.
- `contractCall` and `customTx` always reject on EVM. Stored DeFi approve/deposit/withdraw
  intents also reject: there is no locally trusted vault registry to bind the target or spender.
  Stored `defi-redeem` remains unsupported. Caller-declared DeFi legs retain selector, amount,
  and receiver/owner checks and reject native value; token-wallet approvals also bind the token
  contract. These checks do not establish the vault's identity or the approval spender.
