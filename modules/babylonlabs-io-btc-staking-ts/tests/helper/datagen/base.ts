import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import {
  slashEarlyUnbondedTransaction,
  slashTimelockUnbondedTransaction,
  unbondingTransaction,
} from "../../../src";
import { Staking } from "../../../src/staking";
import { UTXO } from "../../../src/types/UTXO";
import { StakingParams } from "../../../src/types/params";
import { generateRandomAmountSlices } from "../math";
import { StakingScriptData, StakingScripts } from "../../../src/index";
import { MIN_UNBONDING_OUTPUT_VALUE } from "../../../src/constants/unbonding";
import { payments, Psbt, Transaction } from "bitcoinjs-lib";
import { TRANSACTION_VERSION } from "../../../src/constants/psbt";
import { NON_RBF_SEQUENCE } from "../../../src/constants/psbt";
import { internalPubkey } from "../../../src/constants/internalPubkey";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export const DEFAULT_TEST_FEE_RATE = 15;

export interface KeyPair {
  privateKey: string;
  publicKey: string;
  publicKeyNoCoord: string;
  keyPair: bitcoin.Signer;
}

export type SlashingType = "earlyUnbonded" | "timelockExpire";

export class StakingDataGenerator {
  network: bitcoin.networks.Network;

  constructor(network: bitcoin.networks.Network) {
    this.network = network;
  }

  generateStakingParams(
    fixedTerm: boolean = false, committeeSize?: number,
    minStakingAmount?: number
  ): StakingParams {
    if (!committeeSize) {
      committeeSize = this.getRandomIntegerBetween(5, 50);
    }
    const covenantNoCoordPks = this.generateRandomCovenantCommittee(committeeSize).map(
      (buffer) => buffer.toString("hex"),
    );
    const covenantQuorum = Math.floor(Math.random() * (committeeSize - 1)) + 1;
    if (minStakingAmount && minStakingAmount < MIN_UNBONDING_OUTPUT_VALUE + 1) {
      throw new Error("Minimum staking amount is less than the unbonding output value");
    }
    const minStakingAmountSat = minStakingAmount ? minStakingAmount : this.getRandomIntegerBetween(100000, 1000000000);
    const minStakingTimeBlocks = this.getRandomIntegerBetween(1, 2000);
    const maxStakingTimeBlocks = fixedTerm ? minStakingTimeBlocks : this.getRandomIntegerBetween(minStakingTimeBlocks, minStakingTimeBlocks + 1000);
    const timelock = this.generateRandomTimelock({minStakingTimeBlocks, maxStakingTimeBlocks});
    const unbondingTime = this.generateRandomUnbondingTime(timelock);
    const slashingRate = this.generateRandomSlashingRate();
    const minSlashingTxFeeSat = this.getRandomIntegerBetween(1000, 100000);
    return {
      covenantNoCoordPks,
      covenantQuorum,
      unbondingTime,
      unbondingFeeSat: minStakingAmountSat - MIN_UNBONDING_OUTPUT_VALUE - 1,
      minStakingAmountSat,
      maxStakingAmountSat: this.getRandomIntegerBetween(
        minStakingAmountSat, minStakingAmountSat + 1000000000,
      ),
      minStakingTimeBlocks,
      maxStakingTimeBlocks,
      slashing: {
        slashingRate,
        slashingPkScriptHex: getRandomPaymentScriptHex(this.generateRandomKeyPair().publicKey),
        minSlashingTxFeeSat,
      }
    };
  }

  generateMockStakingScripts(
    stakerKeyPair?: KeyPair,
  ): StakingScripts {
    if (!stakerKeyPair) {
      stakerKeyPair = this.generateRandomKeyPair();
    }
    const committeeSize = this.getRandomIntegerBetween(1, 10);
    const globalParams = this.generateStakingParams(
      false,
      committeeSize,
    );
    const stakingTxTimelock = this.generateRandomTimelock(globalParams);

    return this.generateStakingScriptData(
      stakerKeyPair.publicKeyNoCoord,
      globalParams,
      stakingTxTimelock,
    );
  }

  generateStakingScriptData (
    stakerPkNoCoord: string,
    params: StakingParams,
    timelock: number,
  ): StakingScripts {
    const fpPkHex = this.generateRandomKeyPair().publicKeyNoCoord;
    return new StakingScriptData(
      Buffer.from(stakerPkNoCoord, "hex"),
      [Buffer.from(fpPkHex, "hex")],
      params.covenantNoCoordPks.map((pk: string) => Buffer.from(pk, "hex")),
      params.covenantQuorum,
      timelock,
      params.unbondingTime,
    ).buildScripts();
  }

  generateRandomTxId = () => {
    const randomBuffer = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      randomBuffer[i] = Math.floor(Math.random() * 256);
    }
    return randomBuffer.toString("hex");
  };

  generateRandomKeyPair = () => {
    const keyPair = ECPair.makeRandom({ network: this.network });
    const { privateKey, publicKey } = keyPair;
    if (!privateKey || !publicKey) {
      throw new Error("Failed to generate random key pair");
    }
    const pk = publicKey.toString("hex");

    return {
      privateKey: privateKey.toString("hex"),
      publicKey: pk,
      publicKeyNoCoord: pk.slice(2),
      keyPair,
    };
  };

  // Generate a random timelock value
  // ranged from 1 to 65535
  generateRandomTimelock = (
    params: { minStakingTimeBlocks: number, maxStakingTimeBlocks: number},
  ) => {
    if (params.minStakingTimeBlocks === params.maxStakingTimeBlocks) {
      return params.minStakingTimeBlocks;
    }
    return this.getRandomIntegerBetween(
      params.minStakingTimeBlocks,
      params.maxStakingTimeBlocks,
    );
  };

  generateRandomUnbondingTime = (timelock: number) => {
    return Math.floor(Math.random() * timelock) + 1;
  };

  generateRandomFeeRates = () => {
    return Math.floor(Math.random() * 1000) + 1;
  };

  // Real values will likely be in range 0.01 to 0.30
  generateRandomSlashingRate(min: number = 0.01, max: number = 0.30): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  // Convenant committee are a list of public keys that are used to sign a covenant
  generateRandomCovenantCommittee = (size: number): Buffer[] => {
    const committe: Buffer[] = [];
    for (let i = 0; i < size; i++) {
      const publicKeyNoCoord = this.generateRandomKeyPair().publicKeyNoCoord;
      committe.push(Buffer.from(publicKeyNoCoord, "hex"));
    }
    return committe;
  };

  
  getAddressAndScriptPubKey = (publicKey: string) => {
    return {
      taproot: this.getTaprootAddress(publicKey),
      nativeSegwit: this.getNativeSegwitAddress(publicKey),
    };
  };

  getNetwork = () => {
    return this.network;
  };

  generateRandomUTXOs = (
    balance: number,
    numberOfUTXOs: number,
    scriptPubKey?: string,
  ): UTXO[] => {
    if (!scriptPubKey) {
      const pk = this.generateRandomKeyPair().publicKey;
      const { nativeSegwit } = this.getAddressAndScriptPubKey(pk);
      scriptPubKey = nativeSegwit.scriptPubKey;
    }
    const slices = generateRandomAmountSlices(balance, numberOfUTXOs);
    return slices.map((v) => {
      return {
        txid: this.generateRandomTxId(),
        vout: Math.floor(Math.random() * 10),
        scriptPubKey: scriptPubKey,
        value: v,
      };
    });
  };

  /**
   * Generates a random integer between min and max.
   *
   * @param {number} min - The minimum number.
   * @param {number} max - The maximum number.
   * @returns {number} - A random integer between min and max.
   */
  getRandomIntegerBetween = (min: number, max: number): number => {
    if (min > max) {
      throw new Error(
        "The minimum number should be less than or equal to the maximum number.",
      );
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  /**
   * The main entry point for generating a random staking transaction and
   * its instance, as well as getting the staker info, params, and staking amount
   * etc
   * @param network - The network to use
   * @param feeRate - The fee rate to use
   * @param stakerKeyPair - The staker key pair to use
   * @param stakingAmount - The staking amount to use
   * @param addressType - The address type to use
   * @param params - The staking parameters to use
   * @returns {Object} - A random staking transaction
   */
  generateRandomStakingTransaction = (
    network: bitcoin.networks.Network,
    feeRate: number = DEFAULT_TEST_FEE_RATE,
    stakerKeyPair?: KeyPair,
    stakingAmount?: number,
    addressType?: "taproot" | "nativeSegwit",
    params?: StakingParams,
  ) => {
    if (!stakerKeyPair) {
      stakerKeyPair = this.generateRandomKeyPair();
    }
    const stakerInfo = {
      address: this.getAddressAndScriptPubKey(stakerKeyPair.publicKey).nativeSegwit.address,
      publicKeyNoCoordHex: stakerKeyPair.publicKeyNoCoord,
      publicKeyWithCoord: stakerKeyPair.publicKey,
    }
    params = params ? params : this.generateStakingParams();
    const timelock = this.generateRandomTimelock(params);
    const finalityProviderPkNoCoordHex = this.generateRandomKeyPair().publicKeyNoCoord;

    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPkNoCoordHex, timelock,
    );

    const stakingAmountSat = stakingAmount ? 
      stakingAmount : this.getRandomIntegerBetween(
        params.minStakingAmountSat, params.maxStakingAmountSat,
      );

    const { publicKey } = stakerKeyPair;
    const { taproot, nativeSegwit } = this.getAddressAndScriptPubKey(publicKey);
    const scriptPubKey =
      addressType === "taproot"
        ? taproot.scriptPubKey
        : nativeSegwit.scriptPubKey;

    const utxos = this.generateRandomUTXOs(
      this.getRandomIntegerBetween(stakingAmountSat, stakingAmountSat + 100000000),
      this.getRandomIntegerBetween(1, 10),
      scriptPubKey,
    );

    const { transaction: stakingTx, fee: stakingTxFee } = staking.createStakingTransaction(
      stakingAmountSat,
      utxos,
      feeRate,
    );
    
    return {
      stakingTx,
      timelock,
      stakingInstance: staking,
      stakerInfo,
      params,
      finalityProviderPkNoCoordHex,
      stakingAmountSat,
      keyPair: stakerKeyPair,
      stakingTxFee,
    }
  };

  /**
   * Generates a random slashing transaction based on the staking transaction 
   * and staking scripts
   * @param network - The network to use
   * @param stakingScripts - The staking scripts to use
   * @param stakingTx - The staking transaction to use
   * @param params - The params used in the staking transaction
   * @param keyPair - The key pair to use. This is used to sign the slashing 
   * psbt to derive the transaction.
   * @param type - The type of slashing to use.
   * @returns {Object} - A random slashing transaction
   */
  generateSlashingTransaction = (
    network: bitcoin.networks.Network,
    stakingScripts: StakingScripts,
    stakingTx: Transaction,
    params: {
      minSlashingTxFeeSat: number,
      slashingPkScriptHex: string,
      slashingRate: number,
    },
    keyPair: KeyPair,
    type: SlashingType = "timelockExpire",
  ) => {
    let slashingPsbt: Psbt;
    let outputValue: number;

    if (type === "earlyUnbonded") {
      const { transaction: unbondingTx } = unbondingTransaction(
        stakingScripts,
        stakingTx,
        1,
        network,
      );
      const { psbt } = slashEarlyUnbondedTransaction(
        stakingScripts,
        unbondingTx,
        params.slashingPkScriptHex,
        params.slashingRate,
        params.minSlashingTxFeeSat,
        network,
      );
      slashingPsbt = psbt;
      outputValue = unbondingTx.outs[0].value;
    } else {
      const { psbt } = slashTimelockUnbondedTransaction(
        stakingScripts,
        stakingTx,
        params.slashingPkScriptHex,
        params.slashingRate,
        params.minSlashingTxFeeSat,
        network,
      );
      slashingPsbt = psbt;
      outputValue = stakingTx.outs[0].value;
    }

    expect(slashingPsbt).toBeDefined();
    expect(slashingPsbt.txOutputs.length).toBe(2);
    // first output shall send slashed amount to the slashing pk script (i.e burn output)
    expect(Buffer.from(slashingPsbt.txOutputs[0].script).toString("hex")).toBe(
      params.slashingPkScriptHex,
    );
    expect(slashingPsbt.txOutputs[0].value).toBe(
      Math.floor(outputValue * params.slashingRate),
    );

     // second output is the change output which send to unbonding timelock script address
     const changeOutput = payments.p2tr({
      internalPubkey,
      scriptTree: { output: stakingScripts.unbondingTimelockScript },
      network,
    });
    expect(slashingPsbt.txOutputs[1].address).toBe(changeOutput.address);
    const expectedChangeOutputValue =
      outputValue -
      Math.floor(outputValue * params.slashingRate) -
      params.minSlashingTxFeeSat;
    expect(slashingPsbt.txOutputs[1].value).toBe(expectedChangeOutputValue);

    expect(slashingPsbt.version).toBe(TRANSACTION_VERSION);
    expect(slashingPsbt.locktime).toBe(0);
    slashingPsbt.txInputs.forEach((input) => {
      expect(input.sequence).toBe(NON_RBF_SEQUENCE);
    });

    const tx = slashingPsbt.signAllInputs(
      keyPair.keyPair,
    ).finalizeAllInputs().extractTransaction();

    return {
      psbt: slashingPsbt,
      tx,
    };
  }

  randomBoolean(): boolean {
    return Math.random() >= 0.5;
  };

  private getTaprootAddress = (publicKeyWithCoord: string) => {
    // Remove the prefix if it exists
    let publicKeyNoCoord = "";
    if (publicKeyWithCoord.length == 66) {
      publicKeyNoCoord = publicKeyWithCoord.slice(2);
    }
    const internalPubkey = Buffer.from(publicKeyNoCoord, "hex");
    const { address, output: scriptPubKey } = bitcoin.payments.p2tr({
      internalPubkey,
      network: this.network,
    });
    if (!address || !scriptPubKey) {
      throw new Error(
        "Failed to generate taproot address or script from public key",
      );
    }
    return {
      address,
      scriptPubKey: scriptPubKey.toString("hex"),
    };
  };

  private getNativeSegwitAddress = (publicKey: string) => {
    // check the public key length is 66, otherwise throw
    if (publicKey.length !== 66) {
      throw new Error(
        "Invalid public key length for generating native segwit address",
      );
    }
    const internalPubkey = Buffer.from(publicKey, "hex");
    const { address, output: scriptPubKey } = bitcoin.payments.p2wpkh({
      pubkey: internalPubkey,
      network: this.network,
    });
    if (!address || !scriptPubKey) {
      throw new Error(
        "Failed to generate native segwit address or script from public key",
      );
    }
    return {
      address,
      scriptPubKey: scriptPubKey.toString("hex"),
    };
  };
}

export const getRandomPaymentScriptHex = (pubKeyHex: string): string => {
  const pubKeyBuf = Buffer.from(pubKeyHex, "hex");

  // Define the possible payment types
  const paymentTypes = [
    bitcoin.payments.p2pkh({ pubkey: pubKeyBuf }),
    bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey: pubKeyBuf }) }),
    bitcoin.payments.p2wpkh({ pubkey: pubKeyBuf }),
  ];

  // Randomly pick one payment type
  const randomIndex = Math.floor(Math.random() * paymentTypes.length);
  const payment = paymentTypes[randomIndex];

  // Get the scriptPubKey from the selected payment type and return its hex representation
  if (!payment.output) {
    throw new Error("Failed to generate scriptPubKey.");
  }
  
  return payment.output.toString("hex");
}