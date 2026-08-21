# RealFi Transaction Flow Builder

This module builds transaction flow outputs for multi-step RealFi routes. A
flow starts with a final destination, then works backward through each requested
step so every step receives the correct continuation address and datum for the
step that follows it.

The result is a single `TxBuilderFlowResult` containing:

- `address`: where the outermost order output should be locked
- `datum`: the inline datum for that output, when one is needed
- `value`: the assets locked at that output

The entire sequence of steps is folded into the output datum.
Callers of the tx flow builder can then use a Cardano transaction building library (eg. blaze) to create a valid cardano transaction that produces this output.

## Importing

The tx-builder API is exported from the main SDK and from a subpath:

```ts
import { TxBuilder } from "@sundaeswap/realfi-sdk";
```

```ts
import {
  buildTxFlow,
  createTxFlowBuilder,
  txBuilderFlowResultToCoreOutput,
  type TxFlowStep,
} from "@sundaeswap/realfi-sdk/tx-builder";
```

## Flow Steps

The following protocols are supported:

- `RealFiTxFlowStep`: legacy V1.0-only flow step.
- `SundaeV3TxFlowStep`: builds a Sundae V3 swap, deposit, or withdraw order
  datum and points its destination at the next step.
- `RealfiSDK.sundae.buildSwapToStakeOrderTx`: builds a version-neutral
  swap-to-stake order for Sundae V3 or Stableswaps pools. The pool's
  `version` selects Sundae's real transaction and datum builder.

For swap-to-stake, the version-neutral helper asks the version-aware RealFi SDK
to build the stake continuation. It supports the current V1.0 and V1.1 schemas,
uses the live RealFi request address and exchange rate, and computes RealFi's
`min_received` without a caller-supplied vault ratio. The deprecated
`sundaeV3SwapToStake` helper remains available for compatibility with callers
that already supply a fully formed V3 datum input.

## Network Registry

The package includes a `TX_BUILDER_REGISTRY` keyed by network:

- `preview`
- `preprod`
- `mainnet`

Each entry contains request script addresses for legacy flow steps. Sundae V3
request addresses are included. The version-neutral swap-to-stake helper does
not use these Sundae addresses: Sundae's selected V3 or Stableswaps builder
resolves its version-specific validator from current protocol parameters. The
legacy RealFi V1.0 address is included for `preprod`; `preview` runs V1.1, so
the stale V1.0 address is deliberately unset. Both swap-to-stake helpers get
the RealFi address from the live SDK instead of this registry. Trying to build
a legacy RealFi step without an address throws an error.

For most SDK usage, create a network-scoped builder once and let it populate
step addresses from the registry:

```ts
const txFlow = createTxFlowBuilder({ network: "preview" });
```

You can also pass a custom registry:

```ts
const txFlow = createTxFlowBuilder({
  network: "preview",
  registry: {
    preview: {
      realfi: { requestAddress: "addr_test..." },
      sundaeV3: { requestAddress: "addr_test..." },
    },
    preprod: {
      realfi: { requestAddress: "addr_test..." },
      sundaeV3: { requestAddress: "addr_test..." },
    },
    mainnet: {
      realfi: { requestAddress: "addr..." },
      sundaeV3: { requestAddress: "addr..." },
    },
  },
});
```

## Example

```ts
import { AssetAmount } from "@sundaeswap/asset";
import { EDatumType, ESwapType } from "@sundaeswap/core";
import { RealfiSDK } from "@sundaeswap/realfi-sdk";

const ownerAddress = await blaze.wallet.getChangeAddress();
const suppliedAsset = new AssetAmount(100_000_000n, pool.assetA);
const sundae = RealfiSDK.sundae.create(blaze);

// The caller still chooses swap slippage. The SDK uses Sundae's quote logic.
const quote = sundae.quoteSwap({ pool, suppliedAsset, slippage: 0.03 });

const order = await sundae.buildSwapToStakeOrderTx({
  sdk: realfiSdk,
  swap: {
    pool,
    suppliedAsset,
    swapType: {
      type: ESwapType.LIMIT,
      minReceivable: quote.minReceived,
    },
    // This address retains cancellation authority over the Sundae and RealFi
    // orders unless `stake.owner` is deliberately overridden.
    ownerAddress: ownerAddress.toBech32(),
    orderAddresses: {
      // The final destination receives sUSDr and any USDr above the guaranteed
      // swap minimum after RealFi executes the stake order.
      DestinationAddress: {
        address: ownerAddress.toBech32(),
        datum: { type: EDatumType.NONE },
      },
      AlternateAddress: ownerAddress.toBech32(),
    },
  },
  // Optional override for the RealFi leg; the SDK default is used when omitted.
  stake: { slippageToleranceBps: 500n },
});
const { cbor } = await order.build();
```

The helper supports Sundae V3 and Stableswaps without a caller-side branch. It
uses the executable Sundae `minReceived` as the RealFi stake amount, while the
RealFi SDK independently computes the stake leg's sUSDr `min_received`. It does
not accept a separate stake amount, `vaultRatio`, or RealFi `min_received`.

`buildTxFlow` and `txBuilderFlowResultToCoreOutput` are available as
lower-level functions when callers want to provide fully formed steps directly.
The low-level `realfi` and `realfiStake` steps are retained for V1.0 callers.
They serialize the V1.0 schema and require a V1.0 request address;
`realfiStake` also requires the caller to supply a vault ratio. Do not use them
for Preview's V1.1 deployment.

## Destination Helpers

The module also exposes helpers for encoding continuation destinations:

- `realfiDestinationFromStepResult`
- `addressToRealFiDestination`
- `realfiDestinationToAddress`
- `sundaeV3DestinationFromStepResult`
- `inlineDatumFromStepResult`
- `plutusDataFromCbor`

These helpers are useful when integrating new step builders or testing datum
round-trips.
