<p align="center">
    <img alt="Babylon Logo" src="https://github.com/user-attachments/assets/dc74271e-90f1-44bd-9122-2b7438ab375c" width="100" />
    <h3 align="center">@babylonlabs-io/btc-staking-ts</h3>
    <p align="center">Babylon Bitcoin Staking Protocol</p>
    <p align="center"><strong>TypeScript</strong> library</p>
    <p align="center">
      <a href="https://www.npmjs.com/package/btc-staking-ts"><img src="https://badge.fury.io/js/btc-staking-ts.svg" alt="npm version" height="18"></a>
    </p>
</p>
<br/>

## Installation

```console
npm i @babylonlabs-io/btc-staking-ts
```

## Version Release

### Stable version

Stable release versions are manually released from the main branch.

### Canary version

A canary version is a pre-release version. Make sure all changes are added and committed before running the command below:

```console
npm run version:canary
```

## Usage

### Define Staking Parameters

The Staking Parameters correspond to the parameters of the staking contract
and the Bitcoin transaction containing it.

Among others,
they define the input UTXOs that should be used to fund the staking
transaction, the staking value and duration, and the finality provider the user
will delegate to.

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
//       - `magicBytes: Buffer`: The magic bytes that are appended to the data
//          embed script that is used to identify the staking transaction on BTC.
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
const magicBytes: Buffer = Buffer.from("62627434", "hex"); // "bbt4" tag
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

### Fee Calculation
The fee calculation in the @babylonlabs-io/btc-staking-ts library is based on an estimated size 
of the transaction in virtual bytes (vB). This estimation helps in calculating 
the appropriate fee to include in the transaction to ensure it is processed by 
the Bitcoin network efficiently.

The fee estimation formula used is:
```
numInputs * 180 + numOutputs * 34 + 10 + numInputs + 40
```

This accounts for:
- `180 vB` per input
- `34 vB` per output
- `10 vB` fixed buffer
- `numInputs` additional factor
- `40 vB` buffer for the op_return output

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
  minUnbondingTime,
  magicBytes,
);

const {
  timelockScript,
  unbondingScript,
  slashingScript,
  dataEmbedScript,
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
- `dataEmbedScript`: An `OP_RETURN` script containing all required data to
  identify and verify the transaction as a staking transaction.

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
    dataEmbedScript
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
    unbondingScript,
    unbondingTimelockScript,
    timelockScript,
    slashingScript,
  },
  stakingTx,
  unbondingFee,
  network,
);

const signedUnbondingPsbt = await signPsbt(unsignedUnbondingPsbt.psbt.toHex());
const unbondingTx = Psbt.fromHex(signedUnbondingPsbt).extractTransaction();
```

#### Collecting Unbonding Signatures

The above unbonding transaction is partially signed,
as apart from the staker's signature,
it also needs a set of signatures from the covenant committee.

For the first phase of Babylon's mainnet,
the system will have to propagate the unbonding transaction and the staker's
signature to a Babylon maintained back-end that collects the covenant
committee's signatures, adds them to the unbonding transaction to complete the
signature set, and propagates it to Bitcoin.

For completeness, we present the alternative method in which the application
has access to the covenant signature set. This method can be useful for testing
purposes. It involves the following:

```ts
// Create the full witness
const witness = createWitness(
  unbondingTx.ins[0].witness: Buffer[], // original witness
  covenantPks: Buffer[],
  covenantUnbondingSignatures: {
    btc_pk_hex: string;
    sig_hex: string;
  }[],
);

// Put the witness inside the unbonding transaction.
unbondingTx.setWitness(0, witness);
```

### Withdrawing

Withdrawing involves extracting funds for which the staking/unbonding period
has expired from the staking/unbonding transaction.

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
There are two types of withdrawal

1. Withdraw funds from a staking transaction in which the timelock naturally
   expired:

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

2. Withdraw funds from an unbonding transaction that was submitted for early
   unbonding and the unbonding period has passed:

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

### Create slashing transaction

The slashing transaction is the transaction that is sent to Bitcoin in the
event of the finality provider in which the stake has been delegated to
performs an offence.

**For the initial phase of the mainnet, there will be no slashing, so the
following instructions can be safely ignored and are put here for
completeness.**

First, collect the parameters related to slashing.
These are Babylon parameters and should be collected from the Babylon system.

```ts
// The address to which the slashed funds should go to.
const slashingAddress: string = "";
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
  slashingAddress,
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
  slashingAddress,
  slashingRate,
  minimumSlashingFee,
  network,
);

const signedUnbondingSlashingPsbt = await signPsbt(unsignedUnbondingSlashingPsbt.psbt.toHex());
const unbondingSlashingTx = Psbt.fromHex(signedUnbondingSlashingPsbt).extractTransaction();
```
