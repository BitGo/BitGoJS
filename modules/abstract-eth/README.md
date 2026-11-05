# BitGo abstract-eth

## EVM TSS transaction verification

`verifyTssTransaction` decodes the EVM bytes about to be signed and compares `to` / `value` /
`data` with the declared intent before the user key share signs (TOB-BITGOEDMPC-2 /
INFOSEC-671). Verification runs in one mode: a definite mismatch throws
`TxIntentMismatchRecipientError`; a check the verifier cannot perform is reported through
`console.warn('[tss verification] ...')` and signing continues.

- The caller's own `txParams` are authoritative whenever they declare `type` or `recipients`. The
  stored tx request intent is consulted only when the caller declared nothing (pending-approval
  signing). Server data never selects the handler, supplies absent caller calldata, or replaces a
  declared token. `payment` and `transfer` are the same intent; `transferToken` is not a payment
  and keeps its own specialised handling.
- A payment must match a closed set of shapes: a native send (`to` / `value`, empty data), an
  ERC-20 `transfer(address,uint256)` to the declared token contract with zero native value, an
  ERC-7984 `confidentialTransfer` (recipient checked, encrypted amount cannot be), or a batcher
  batch. A recipient that declares its own calldata (WalletConnect) is verified against that exact
  `to` / `value` / `data`, nonzero native value included. Batch payments must target the network
  batcher and match the decoded recipient/amount arrays 1:1, with `value` equal to the sum
  (native) or zero (token).
- Token identity comes only from locally trusted declarations: recipient `tokenAddress` /
  `tokenName` / `tokenData`, the top-level `tokenName`, and the coin instance. A declaration only
  counts when it resolves on the transaction's own network: a name that resolves on another chain
  (including non-EVM coins and tokens such as `sol:usdc`) is never read as this chain's native
  asset or as a local contract, and the asset stays unresolved so the missing check is reported.
  Identity that cannot be resolved to an EVM contract, or that names two assets, is reported the
  same way, and the checks that do not depend on it are still enforced. Calldata is compared in
  canonical form and the supported shapes reject trailing bytes.
- A consolidation is recognised from the `consolidate` / `consolidateToken` intent type, a
  consolidate id, or the caller's `verification.consolidationToBaseAddress` flag; a token
  consolidation is recognised from its intent type even when the consolidate id is absent, while
  the missing-params guard is unchanged — the call still needs recipients or a consolidate id.
  A native consolidation is a plain send to the wallet base address and must carry no calldata.
  Native counts as *declared* only when an authorised field names the chain asset; a generic
  `consolidate` that declares no asset is not assumed native, because the same type carries
  ERC-20 and specialised sweeps. ERC-20 expectations are applied only on positive evidence: the
  exported ERC-20 families (`Erc20Coin`, `CeloCoin`, `AvaxERC20Token`) matched by class identity,
  plus the unexported BSC/XDC/L2/generic ERC-20 families matched by a verified class allowlist.
  Any other token class — an NFT, a specialised standard, a future type, or a name a bundler
  rewrote — stays unclassified and is reported, never assumed to be ERC-20; ERC-7984 tokens are
  verified by their own coin. A token consolidation on an ERC-20 contract must
  be exactly `transfer(baseAddress, amount)` — canonical calldata, no trailing bytes — paying
  the base address with zero native value; any other function, batch encodings included, is
  rejected, and native value on an ERC-20 sweep is rejected. How a specialised or unclassified
  standard behaves with native value is not established, so it is reported instead.
  Shapes this verifier does not model are reported, not rejected: a batch or arbitrary call with no
  asset declared, non-`transfer` calldata while the token contract is unresolved, and any shape on
  a specialised (ERC-7984) token, whose consolidation is verified by its own coin. The flag-driven
  path also keeps its historic rule that a tx which is not an ERC-20 transfer must pay the wallet
  base address with `tx.to`; when `to` *is* the base address, the bytes are otherwise checked
  against the asset declaration, reported, or rejected as above. The token contract is compared
  with the identity the intent declares, taken from the caller when it declared the intent and
  otherwise from the stored intent (`tokenData.tokenName` / `tokenContractAddress`, recipient
  `tokenAddress`), and **only when that declaration exists and resolves through statics to exactly
  one EVM contract**. Without such a declaration the base address, the calldata shape and the zero
  native value are still enforced, and a warning names the token contract as unchecked: an
  unresolved declaration is never treated as a verified contract, so no consolidation path claims
  more than it proved. Consolidations never compare amounts — a sweep moves whatever the address
  holds, so the calldata amount is not verified against any intent amount.
- Missing or malformed transaction bytes always fail, including for intent types without intent
  rules and for consolidations whose base address is unavailable. For types without rules the EVM
  encoding is validated first, then a warning states that the bytes were not compared against the
  intent. Non-EVM formats are owned by the coin that supports them, never sniffed here: the `Flr`
  override recognises FLR's atomic cross-chain bytes (export, import, importtoc) with the FLR
  parser and warns that they were not verified against the intent, and Tempo / VET override
  `verifyTransaction`. Any payload that reaches this verifier must decode as an EVM transaction,
  so an unrecognised non-EVM payload is rejected. `contractCall` and `customTx` always reject.
- Not implemented and therefore reported, not verified: `transferToken` / NFT payments,
  `tokenApproval`, `fillNonce`, staking intents, `acceleration`, `bridgeFunds`, `enableToken` /
  `disableToken`, DeFi redeem, consolidations whose intent declares no asset (batch and arbitrary
  calldata), batches of an unresolved token, and stored DeFi approve/deposit/withdraw legs
  (no locally trusted vault registry anchors their target or spender). FLR atomic imports are
  handled in the `Flr` override and never reach this verifier. ERC-7984 `confidentialTransfer`
  amounts are encrypted and cannot be compared.
