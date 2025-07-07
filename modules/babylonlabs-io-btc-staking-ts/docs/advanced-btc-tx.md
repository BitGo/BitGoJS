# Advanced BTC Staking Transaction Usage

> ⚠️ **WARNING**: This documentation describes advanced usage of btc-staking-ts 
> where you can customize transaction parameters to fit your specific needs. 
> While this offers more flexibility, creating custom Bitcoin transactions 
> carries inherent risks. Incorrect parameters or improper usage could result 
> in loss of funds. Proceed at your own risk and thoroughly test all transactions 
> in a test environment first.


This guide demonstrates how to manually construct Bitcoin staking transactions by customizing various parameters such as covenant settings, staking durations, and transaction details. It's intended for developers who need fine-grained control over the Bitcoin transaction aspect of the staking process. It does not cover the Babylon transaction aspect.


## Advanced Usage

### Define Staking Parameters

To determine the correct parameter version to use, this library provides two utility methods:
- `getBabylonParamByBtcHeight`: Get parameters based on Bitcoin block height
- `getBabylonParamByVersion`: Get parameters based on version number

These methods ensure you use the appropriate parameter set based on the current state of the Babylon network.

```ts
import { networks } from "bitcoinjs-lib";

// 1. Collect the Babylon system parameters.
//    These are parameters that are shared between for all Bitcoin staking
//    transactions, and are maintained by Babylon governance.
//    They involve:
//       - `covenantPks: Buffer[]`: A list of the public keys
//          without the coordinate bytes correspondongin to the
//          covenant emulators.
//       - `covenantThreshold: number`: The amount of covenant
//          emulator signatures required for the staking to be activated.
//       - `minimumUnbondingTime: number`: The minimum unbonding period
//          allowed by the Babylon system .
//       - `lockHeight: number`: Indicates the BTC height before which
//          the transaction is considered invalid. This value can be derived from
//          the `activationHeight` of the Babylon versioned global parameters
//          where the current BTC height is. Note that if the 
//          `current BTC height + 1 + confirmationDepth` is going to be >=
//          the next versioned `activationHeight`, then you should use the 
//          `activationHeight` from the next version of the global parameters.
//    Below, these values are hardcoded, but they should be retrieved from the
//    Babylon system.
const covenantPks: Buffer[] = covenant_pks.map((pk) => Buffer.from(pk, "hex"));
const covenantThreshold: number = 3;
const minUnbondingTime: number = 101;
// Optional field. Value coming from current global param activationHeight
const lockHeight: number = 0;

// 2. Define the user selected parameters of the staking contract:
//    - `stakerPk: Buffer`: The public key without the coordinate of the
//       staker.
//    - `finalityProviders: Buffer[]`: A list of public keys without the
//       coordinate corresponding to the finality providers. Currently,
//       a delegation to only a single finality provider is allowed,
//       so the list should contain only a single item.
//    - `stakingDuration: number`: The staking period in BTC blocks.
//    - `stakingAmount: number`: The amount to be staked in satoshis.
//    - `unbondingTime: number`: The unbonding time. Should be `>=` the
//      `minUnbondingTime`.

const stakerPk: Buffer = btcWallet.publicKeyNoCoord();
const finalityProviders: Buffer[] = [
  Buffer.from(finalityProvider.btc_pk_hex, "hex"),
];
const stakingDuration: number = 144;
const stakingAmount: number = 1000;
const unbondingTime: number = minUnbondingTime;

// 3. Define the parameters for the staking transaction that will contain the
//    staking contract:
//    - `inputUTXOs: UTXO[]`: The list of UTXOs that will be used as an input
//       to fund the staking transaction.
//    - `feeRate: number`: The fee per tx byte in satoshis.
//    - `changeAddress: string`: BTC wallet change address, Taproot or Native
//       Segwit.
//    - `network: network to work with, either networks.testnet
//       for BTC Testnet and BTC Signet, or networks.bitcoin for BTC Mainnet.

// Each object in the inputUTXOs array represents a single UTXO with the following properties:
// - txid: transaction ID, string
// - vout: output index, number
// - value: value of the UTXO, in satoshis, number
// - scriptPubKey: script which provides the conditions that must be fulfilled for this UTXO to be spent, string
const inputUTXOs = [
  {
    txid: "e472d65b0c9c1bac9ffe53708007e57ab830f1bf09af4bfbd17e780b641258fc",
    vout: 2,
    value: 9265692,
    scriptPubKey: "0014505049839bc32f869590adc5650c584e17c917fc",
  },
];
const feeRate: number = 18;
const changeAddress: string = btcWallet.address;
const network = networks.testnet;
```

### Create the Staking Contract

After defining its parameters,
the staking contract can be created.
First, create an instance of the `StakingScriptData` class
and construct the Bitcoin scipts associated with Bitcoin staking using it.

```ts
import { StakingScriptData } from "@babylonlabs-io/btc-staking-ts";

const stakingScriptData = new StakingScriptData(
  stakerPk,
  finalityProviders,
  covenantPks,
  covenantThreshold,
  stakingDuration,
  minUnbondingTime
);

const {
  timelockScript,
  unbondingScript,
  slashingScript,
  unbondingTimelockScript,
} = stakingScriptData.buildScripts();
```

The above scripts correspond to the following:

- `timelockScript`: A script that allows the Bitcoin to be retrieved only
  through the staker's signature and the staking period being expired.
- `unbondingScript`: The script that allows on-demand unbonding.
  Requires the staker's signature and the covenant committee's signatures.
- `slashingScript`: The script that enables slashing.
  It requires the staker's signature and in this phase the staker should not sign it.

### Create a staking transaction

Using the Bitcoin staking scripts, you can generate a Bitcoin staking
transaction and later sign it using a supported wallet's method.
In this instance, we use the `btcWallet.signTransaction()` method.

```ts
import { stakingTransaction } from "@babylonlabs-io/btc-staking-ts";
import { Psbt, Transaction } from "bitcoinjs-lib";

// stakingTransaction constructs an unsigned BTC Staking transaction
const unsignedStakingPsbt: {psbt: Psbt, fee: number} = stakingTransaction(
  scripts: {
    timelockScript,
    unbondingScript,
    slashingScript,
  },
  stakingAmount,
  changeAddress,
  inputUTXOs,
  network(),
  feeRate,
  btcWallet.isTaproot ? btcWallet.publicKeyNoCoord() : undefined,
  lockHeight,
);

const signedStakingPsbt = await btcWallet.signPsbt(unsignedStakingPsbt.psbt.toHex());
const stakingTx = Psbt.fromHex(signedStakingPsbt).extractTransaction();
```

Public key is needed only if the wallet is in Taproot mode, for `tapInternalKey`.

### Create unbonding transaction

The staking script allows users to on-demand unbond their locked stake before
the staking transaction timelock expires, subject to an unbonding period.

The unbonding transaction can be created as follows:

```ts
import { unbondingTransaction } from "@babylonlabs-io/btc-staking-ts";
import { Psbt, Transaction } from "bitcoinjs-lib";

// Unbonding fee in satoshis. number
const unbondingFee: number = 500;

const unsignedUnbondingPsbt: {psbt: Psbt} = unbondingTransaction(
  scripts: {
    unbondingTimelockScript,
    slashingScript,
  },
  stakingTx,
  unbondingFee,
  network,
  outputIndex // The staking transaction output path index
);

const signedUnbondingPsbt = await signPsbt(unsignedUnbondingPsbt.psbt.toHex());
const unbondingTx = Psbt.fromHex(signedUnbondingPsbt).extractTransaction();
```

#### Collecting Unbonding Signatures

The unbonding transaction requires two types of signatures to be valid and 
acceptable by the Bitcoin network:
1. The staker's signature
2. The covenant committee signatures

To obtain a complete, valid unbonding transaction that can be submitted to 
Bitcoin, you'll need to retrieve the covenant signatures from the Babylon 
network after:
- Your delegation has been successfully registered on Babylon
- The covenant committee has verified your delegation

You can obtain these covenant signatures either by:
- Querying the Babylon node directly
- Using the Babylon API endpoints

Once you have both the staker's signature and the covenant signatures, 
you can combine them like this:

```ts
// Create the full witness
const witness = createCovenantWitness(
  unbondingTx.ins[0].witness: Buffer[], // original witness
  covenantPks: Buffer[],
  covenantUnbondingSignatures: {
    btc_pk_hex: string;
    sig_hex: string;
  }[],
  covenantQuorum
);

// Put the witness inside the unbonding transaction.
unbondingTx.ins[0].witness = witness;;
```

### Withdrawing

Withdrawing involves extracting funds for which the staking/unbonding period has expired from the staking/unbonding transaction.

Initially, we specify the withdrawal transaction parameters.

```ts
// The index of the staking/unbonding output in the staking/unbonding
// transcation.
const stakingOutputIndex: number = 0;

// The fee that the withdrawl transaction should use.
const withdrawalFee: number = 500;

// The address to which the funds should be withdrawed to.
const withdrawalAddress: string = btcWallet.address;
```

Then, we construct the withdrawal transaction.
There are three types of withdrawal

1. Withdraw funds from a staking transaction in which the timelock naturally expired:

```ts
import { Psbt, Transaction } from "bitcoinjs-lib";
import { withdrawTimelockUnbondedTransaction } from "@babylonlabs-io/btc-staking-ts";

// staking transaction. Transaction
const stakingTx: Transaction = undefined;

const unsignedWithdrawalPsbt: {psbt: Psbt, fee: number} = withdrawTimelockUnbondedTransaction(
  scripts: {
    timelockScript,
    slashingScript,
    unbondingScript,
  },
  stakingTx,
  btcWallet.address,
  network,
  feeRate,
  stakingOutputIndex,
);
```

2. Withdraw funds from an unbonding transaction that was submitted for early unbonding and the unbonding period has passed:

```ts
import { Psbt, Transaction } from "bitcoinjs-lib";
import { withdrawEarlyUnbondedTransaction } from "@babylonlabs-io/btc-staking-ts";

const unsignedWithdrawalPsbt: { psbt: Psbt, fee: number } = withdrawEarlyUnbondedTransaction(
  scripts: {
    unbondingTimelockScript,
    slashingScript,
  },
  unbondingTx,
  withdrawalAddress,
  network,
  feeRate,
);

const signedWithdrawalPsbt = await signPsbt(unsignedWithdrawalPsbt.psbt.toHex());
const withdrawalTransaction = Psbt.fromHex(signedWithdrawalPsbt).extractTransaction();
```

3. Withdraw from a slashed transaction where its timelock has expired

```ts
import { Psbt, Transaction } from "bitcoinjs-lib";
import { withdrawSlashingTransaction } from "@babylonlabs-io/btc-staking-ts";


const unsignedWithdrawalPsbt: { psbt: Psbt, fee: number } = withdrawSlashingTransaction(
  scripts: {
    unbondingTimelockScript,
  },
  slashingTx,
  withdrawalAddress,
  network,
  feeRate,
  outputIndex // the output index from the slashing tx
);

const signedWithdrawalPsbt = await signPsbt(unsignedWithdrawalPsbt.psbt.toHex());
const withdrawalTransaction = Psbt.fromHex(signedWithdrawalPsbt).extractTransaction();
```

### Create slashing transaction

The slashing transaction is the transaction that is sent to Bitcoin in the event of the finality provider in which the stake has been delegated to performs an offence.

First, collect the parameters related to slashing.
These are Babylon parameters and should be collected from the Babylon system.

```ts
// The public key script to send the slashed funds to.
const slashingPkScriptHex: string = "";
// The slashing percentage rate. It shall be decimal number between 0-1
const slashingRate: number = 0;
// The required fee for the slashing transaction in satoshis.
const minimumSlashingFee: number = 500;
```

Then create and sign the slashing transaction.
There are two types of slashing transactions:

1. Slashing of the staking transaction when no unbonding has been performed:

```ts
import { slashTimelockUnbondedTransaction } from "@babylonlabs-io/btc-staking-ts";
import { Psbt, Transaction } from "bitcoinjs-lib";

const outputIndex: number = 0;

const unsignedSlashingPsbt: {psbt: Psbt} = slashTimelockUnbondedTransaction(
  scripts: {
    slashingScript,
    unbondingScript,
    timelockScript,
    unbondingTimelockScript,
  },
  stakingTx,
  slashingPkScriptHex,
  slashingRate,
  minimumSlashingFee,
  network,
  outputIndex,
);

const signedSlashingPsbt = await signPsbt(unsignedSlashingPsbt.psbt.toHex());
const slashingTx = Psbt.fromHex(signedSlashingPsbt).extractTransaction();
```

2. Slashing of the unbonding transaction in the case of on-demand unbonding:

create unsigned unbonding slashing transaction

```ts
import { Psbt, Transaction } from "bitcoinjs-lib";
import { slashEarlyUnbondedTransaction } from "@babylonlabs-io/btc-staking-ts";

const unsignedUnbondingSlashingPsbt: {psbt: Psbt} = slashEarlyUnbondedTransaction(
  scripts: {
    slashingScript,
    unbondingTimelockScript,
  },
  unbondingTx,
  slashingPkScriptHex,
  slashingRate,
  minimumSlashingFee,
  network,
);

const signedUnbondingSlashingPsbt = await signPsbt(unsignedUnbondingSlashingPsbt.psbt.toHex());
const unbondingSlashingTx = Psbt.fromHex(signedUnbondingSlashingPsbt).extractTransaction();
```
