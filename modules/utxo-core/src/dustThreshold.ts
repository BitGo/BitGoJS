import * as utxolib from '@bitgo/utxo-lib';

/**
 * Checks if the output script is a witness script or not
 * @param script
 * @returns true if the script is a witness script
 */
function isWitnessOutputScript(script: Buffer): boolean {
  /**
   * Source: https://github.com/bitcoin/bitcoin/blob/v28.1/src/script/script.cpp#L241-L257
   * A witness program is any valid CScript that consists of a 1-byte push opcode
   * followed by a data push between 2 and 40 bytes.
   */
  if (script.length < 4 || script.length > 42) {
    return false;
  }
  if (script[0] !== utxolib.opcodes.OP_0 && (script[0] < utxolib.opcodes.OP_1 || script[0] > utxolib.opcodes.OP_16)) {
    return false;
  }
  return script[1] + 2 === script.length;
}

/*

The dust threshold for most UTXO coins is dependent on multiple factors:

(1) spendability of the output (OP_RETURNs are allowed to be 0 sized)
(2) whether it is a witness or non-witness output
(3) a particular fee rate (GetDiscardRate())

I will do the analysis mostly for bitcoin here and then generalize.

On the indexer we use `sendrawtransaction`, which calls `IsStandardTx` like this

https://github.com/bitcoin/bitcoin/blob/v28.0/src/kernel/mempool_options.h#L47

```
if (
  m_pool.m_opts.require_standard &&
   !IsStandardTx(tx,
   m_pool.m_opts.max_datacarrier_bytes,
   m_pool.m_opts.permit_bare_multisig,
   m_pool.m_opts.dust_relay_feerate, reason))
```

The `dust_relay_feerate` in this context is a hardcoded constant:
https://github.com/bitcoin/bitcoin/blob/v28.0/src/policy/policy.h#L50-L55

(that can actually be overridden with a hidden command
line parameter: https://bitcoin.stackexchange.com/a/41082/137601)

There we call `IsDust`

https://github.com/bitcoin/bitcoin/blob/v28.0/src/policy/policy.cpp#L144-L146

```
if (IsDust(txout, dust_relay_fee)) {
    reason = "dust";
    return false;
}
```

Which calls `GetDustThreshold`,

https://github.com/bitcoin/bitcoin/blob/v28.0/src/policy/policy.cpp#L67

The implementation of `GetDustThreshold` computes the minimal transaction size that can spend the output, and computes
a minimum fee for that transaction size based on the `dust_relay_fee` (FeeRate) parameter.

The different utxo implementations differ in these ways:

- some have a fixed, satoshi amount dust limit (doge, zec)
- some have a different dust_relay_fee

*/

type DustLimit = { feeRateSatKB: number } | { satAmount: number };

function getDustRelayLimit(network: utxolib.Network): DustLimit {
  network = utxolib.getMainnet(network);
  switch (network) {
    case utxolib.networks.bitcoin:
    case utxolib.networks.bitcoingold:
    case utxolib.networks.dash:
      // btc:  https://github.com/bitcoin/bitcoin/blob/v28.0/src/policy/policy.h#L50-L55
      // btg:  https://github.com/BTCGPU/BTCGPU/blob/v0.17.3/src/policy/policy.h#L48
      // dash: https://github.com/dashpay/dash/blob/v22.0.0-beta.1/src/policy/policy.h#L41-L46
      return { feeRateSatKB: 3000 };
    case utxolib.networks.bitcoincash:
      // https://github.com/bitcoin-cash-node/bitcoin-cash-node/blob/v27.1.0/src/policy/policy.h#L76-L83
      // I actually haven't looked at BSV and am depressed that I still need to handle the case here
      return { feeRateSatKB: 1000 };
    case utxolib.networks.dogecoin:
      // https://github.com/dogecoin/dogecoin/blob/v1.14.8/src/policy/policy.h#L65-L81
      // (COIN / 100) / 10;
      return { satAmount: 1_000_000 };
    case utxolib.networks.litecoin:
      //  https://github.com/litecoin-project/litecoin/blob/master/src/policy/policy.h#L47-L52
      return { feeRateSatKB: 30_000 };
    case utxolib.networks.zcash:
      // https://github.com/zcash/zcash/blob/master/src/primitives/transaction.h#L396-L399
      // https://github.com/zcash/zcash/blob/v6.0.0/src/policy/policy.h#L43-L89 (I don't quite get it)
      return { satAmount: 300 };
    case utxolib.networks.bitcoinsv:
      throw new Error('deprecated coin');
    default:
      throw new Error('unsupported network');
  }
}

function getSpendSize(network: utxolib.Network, outputSize: number, isWitness: boolean): number {
  network = utxolib.getMainnet(network);
  switch (network) {
    case utxolib.networks.bitcoin:
    case utxolib.networks.bitcoincash:
    case utxolib.networks.bitcoingold:
    case utxolib.networks.litecoin:
      /*
        btc:  https://github.com/bitcoin/bitcoin/blob/v28.0/src/policy/policy.cpp#L26-L68
        bch:  https://github.com/bitcoin-cash-node/bitcoin-cash-node/blob/v27.1.0/src/policy/policy.cpp#L18-L36 (btc-ish)
        btg:  https://github.com/BTCGPU/BTCGPU/blob/v0.17.3/src/policy/policy.cpp#L18-L50 (btc-ish)
        ltc:  https://github.com/litecoin-project/litecoin/blob/v0.21.4/src/policy/policy.cpp#L15-L47 (btc-ish)

        The fixed component here is 69.75 for isWitness=true and 150 for isWitness=false.
       */
      return outputSize + 32 + 4 + 1 + 107 / (isWitness ? 4 : 1) + 4;
    case utxolib.networks.dash:
      // dash: https://github.com/dashpay/dash/blob/v21.1.1/src/policy/policy.cpp#L14-L30 (btc-ish)
      // how did they end up with 148? I don't know
      return outputSize + 148;
    case utxolib.networks.dogecoin:
    case utxolib.networks.zcash:
      // doge: https://github.com/dogecoin/dogecoin/blob/v1.14.8/src/policy/policy.h#L65-L81 (hardcoded)
      // zec:  https://github.com/zcash/zcash/blob/v6.0.0/src/policy/policy.h#L43-L89 (some weird other thing, doge-ish)
      throw new Error('dust limit is size-independent');
    case utxolib.networks.bitcoinsv:
      throw new Error('deprecated coin');
    default:
      throw new Error('unsupported network');
  }
}

export function getDustThresholdSat(network: utxolib.Network, outputSize: number, isWitness: boolean): number {
  const dustLimit = getDustRelayLimit(network);
  if ('satAmount' in dustLimit) {
    return dustLimit.satAmount;
  }
  if ('feeRateSatKB' in dustLimit) {
    const spendSize = getSpendSize(network, outputSize, isWitness);
    return Math.ceil((dustLimit.feeRateSatKB * spendSize) / 1000);
  }
  throw new Error('unexpected dustLimit');
}

export function getDustThresholdSatForOutputScript(network: utxolib.Network, script: Buffer): number {
  return getDustThresholdSat(network, script.length, isWitnessOutputScript(script));
}
