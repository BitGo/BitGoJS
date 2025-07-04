import { networks, Psbt, Transaction } from "bitcoinjs-lib";
import { StakingParams, VersionedStakingParams } from "../types/params";
import { TransactionResult, UTXO } from "../types";
import { StakerInfo, Staking } from ".";
import {
  btccheckpoint,
  btcstaking,
  btcstakingtx,
} from "@babylonlabs-io/babylon-proto-ts";
import {
  BIP322Sig,
  BTCSigType,
  ProofOfPossessionBTC,
} from "@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop";
import { BABYLON_REGISTRY_TYPE_URLS } from "../constants/registry";
import { createCovenantWitness } from "./transactions";
import { getBabylonParamByBtcHeight, getBabylonParamByVersion } from "../utils/staking/param";
import { reverseBuffer } from "../utils";
import { deriveStakingOutputInfo } from "../utils/staking";
import { findMatchingTxOutputIndex } from "../utils/staking";
import { isValidBabylonAddress } from "../utils/babylon";
import { StakingError } from "../error";
import { StakingErrorCode } from "../error";
import { isNativeSegwit, isTaproot } from "../utils/btc";

export interface BtcProvider {
  // Sign a PSBT
  // Expecting the PSBT to be encoded in hex format.
  signPsbt(signingStep: SigningStep, psbtHex: string): Promise<string>;
  
  // Signs a message using either ECDSA or BIP-322, depending on the address type.
  // - Taproot and Native Segwit addresses will use BIP-322.
  // - Legacy addresses will use ECDSA.
  // Expecting the message to be encoded in base64 format.
  signMessage: (
    signingStep: SigningStep, message: string, type: "ecdsa" | "bip322-simple"
  ) => Promise<string>;
}

export interface BabylonProvider {
  /**
   * Signs a Babylon chain transaction using the provided signing step.
   * This is primarily used for signing MsgCreateBTCDelegation transactions
   * which register the BTC delegation on the Babylon Genesis chain.
   * 
   * @param {SigningStep} signingStep - The current signing step context
   * @param {object} msg - The Cosmos SDK transaction message to sign
   * @param {string} msg.typeUrl - The Protobuf type URL identifying the message type
   * @param {T} msg.value - The transaction message data matching the typeUrl
   * @returns {Promise<Uint8Array>} The signed transaction bytes
   */
  signTransaction: <T extends object>(
    signingStep: SigningStep,
    msg: {
      typeUrl: string;
      value: T;
    }
  ) => Promise<Uint8Array>
}

// Event types for the Signing event
export enum SigningStep {
  STAKING_SLASHING = "staking-slashing",
  UNBONDING_SLASHING = "unbonding-slashing",
  PROOF_OF_POSSESSION = "proof-of-possession",
  CREATE_BTC_DELEGATION_MSG = "create-btc-delegation-msg",
  STAKING = "staking",
  UNBONDING = "unbonding",
  WITHDRAW_STAKING_EXPIRED = "withdraw-staking-expired",
  WITHDRAW_EARLY_UNBONDED = "withdraw-early-unbonded",
  WITHDRAW_SLASHING = "withdraw-slashing",
}

interface StakingInputs {
  finalityProviderPkNoCoordHex: string;
  stakingAmountSat: number;
  stakingTimelock: number;
}

// Inclusion proof for a BTC staking transaction that is included in a BTC block
// This is used for post-staking registration on the Babylon chain
// You can refer to https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-transaction-get-merkle
// for more information on the inclusion proof format.
interface InclusionProof {
  // The 0-based index of the position of the transaction in the ordered list 
  // of transactions in the block.
  pos: number;
  // A list of transaction hashes the current hash is paired with, recursively, 
  // in order to trace up to obtain merkle root of the block, deepest pairing first.
  merkle: string[];
  // The block hash of the block that contains the transaction
  blockHashHex: string;
}

export class BabylonBtcStakingManager {
  protected stakingParams: VersionedStakingParams[];
  protected btcProvider: BtcProvider;
  protected network: networks.Network;
  protected babylonProvider: BabylonProvider;

  constructor(
    network: networks.Network,
    stakingParams: VersionedStakingParams[],
    btcProvider: BtcProvider,
    babylonProvider: BabylonProvider,
  ) {
    this.network = network;
    this.btcProvider = btcProvider;
    this.babylonProvider = babylonProvider;

    if (stakingParams.length === 0) {
      throw new Error("No staking parameters provided");
    }
    this.stakingParams = stakingParams;
  }

  /**
   * Creates a signed Pre-Staking Registration transaction that is ready to be
   * sent to the Babylon chain.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param stakingInput - The staking inputs.
   * @param babylonBtcTipHeight - The Babylon BTC tip height.
   * @param inputUTXOs - The UTXOs that will be used to pay for the staking
   * transaction.
   * @param feeRate - The fee rate in satoshis per byte. Typical value for the
   * fee rate is above 1. If the fee rate is too low, the transaction will not
   * be included in a block.
   * @param babylonAddress - The Babylon bech32 encoded address of the staker.
   * @returns The signed babylon pre-staking registration transaction in base64 
   * format.
   */
  async preStakeRegistrationBabylonTransaction(
    stakerBtcInfo: StakerInfo,
    stakingInput: StakingInputs,
    babylonBtcTipHeight: number,
    inputUTXOs: UTXO[],
    feeRate: number,
    babylonAddress: string,
  ): Promise<{
    signedBabylonTx: Uint8Array;
    stakingTx: Transaction;
  }> {
    if (babylonBtcTipHeight === 0) {
      throw new Error("Babylon BTC tip height cannot be 0");
    }
    if (inputUTXOs.length === 0) {
      throw new Error("No input UTXOs provided");
    }
    if (!isValidBabylonAddress(babylonAddress)) {
      throw new Error("Invalid Babylon address");
    }

    // Get the Babylon params based on the BTC tip height from Babylon chain
    const params = getBabylonParamByBtcHeight(
      babylonBtcTipHeight,
      this.stakingParams,
    );

    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );

    // Create unsigned staking transaction
    const { transaction } = staking.createStakingTransaction(
      stakingInput.stakingAmountSat,
      inputUTXOs,
      feeRate,
    );

    // Create delegation message without including inclusion proof
    const msg = await this.createBtcDelegationMsg(
      staking,
      stakingInput,
      transaction,
      babylonAddress,
      stakerBtcInfo,
      params,
    );
    return {
      signedBabylonTx: await this.babylonProvider.signTransaction(
        SigningStep.CREATE_BTC_DELEGATION_MSG,
        msg,
      ),
      stakingTx: transaction,
    };
  }

  /**
   * Creates a signed post-staking registration transaction that is ready to be 
   * sent to the Babylon chain. This is used when a staking transaction is 
   * already created and included in a BTC block and we want to register it on 
   * the Babylon chain.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param stakingTx - The staking transaction.
   * @param stakingTxHeight - The BTC height in which the staking transaction 
   * is included.
   * @param stakingInput - The staking inputs.
   * @param inclusionProof - Merkle Proof of Inclusion: Verifies transaction
   * inclusion in a Bitcoin block that is k-deep.
   * @param babylonAddress - The Babylon bech32 encoded address of the staker.
   * @returns The signed babylon transaction in base64 format.
   */
  async postStakeRegistrationBabylonTransaction(
    stakerBtcInfo: StakerInfo,
    stakingTx: Transaction,
    stakingTxHeight: number,
    stakingInput: StakingInputs,
    inclusionProof: InclusionProof,
    babylonAddress: string,
  ): Promise<{
    signedBabylonTx: Uint8Array;
  }> {
    // Get the Babylon params at the time of the staking transaction
    const params = getBabylonParamByBtcHeight(stakingTxHeight, this.stakingParams);

    if (!isValidBabylonAddress(babylonAddress)) {
      throw new Error("Invalid Babylon address");
    }

    const stakingInstance = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );

    // Validate if the stakingTx is valid based on the retrieved Babylon param
    const scripts = stakingInstance.buildScripts();
    const stakingOutputInfo = deriveStakingOutputInfo(scripts, this.network);
    // Error will be thrown if the expected staking output address is not found
    // in the stakingTx
    findMatchingTxOutputIndex(
      stakingTx,
      stakingOutputInfo.outputAddress,
      this.network,
    )

    // Create delegation message
    const delegationMsg = await this.createBtcDelegationMsg(
      stakingInstance,
      stakingInput,
      stakingTx,
      babylonAddress,
      stakerBtcInfo,
      params,
      this.getInclusionProof(inclusionProof),
    );
    return {
      signedBabylonTx: await this.babylonProvider.signTransaction(
        SigningStep.CREATE_BTC_DELEGATION_MSG,
        delegationMsg,
      ),
    };
  }

  /**
   * Estimates the BTC fee required for staking.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param babylonBtcTipHeight - The BTC tip height recorded on the Babylon
   * chain.
   * @param stakingInput - The staking inputs.
   * @param inputUTXOs - The UTXOs that will be used to pay for the staking
   * transaction.
   * @param feeRate - The fee rate in satoshis per byte. Typical value for the
   * fee rate is above 1. If the fee rate is too low, the transaction will not
   * be included in a block.
   * @returns The estimated BTC fee in satoshis.
   */
  estimateBtcStakingFee(
    stakerBtcInfo: StakerInfo,
    babylonBtcTipHeight: number,
    stakingInput: StakingInputs,
    inputUTXOs: UTXO[],
    feeRate: number,
  ): number {
    if (babylonBtcTipHeight === 0) {
      throw new Error("Babylon BTC tip height cannot be 0");
    }
    // Get the param based on the tip height
    const params = getBabylonParamByBtcHeight(
      babylonBtcTipHeight,
      this.stakingParams,
    );

    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { fee: stakingFee } = staking.createStakingTransaction(
      stakingInput.stakingAmountSat,
      inputUTXOs,
      feeRate,
    );

    return stakingFee;
  }

  /**
   * Creates a signed staking transaction that is ready to be sent to the BTC 
   * network.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param stakingInput - The staking inputs.
   * @param unsignedStakingTx - The unsigned staking transaction.
   * @param inputUTXOs - The UTXOs that will be used to pay for the staking
   * transaction.
   * @param stakingParamsVersion - The params version that was used to create the
   * delegation in Babylon chain
   * @returns The signed staking transaction.
   */
  async createSignedBtcStakingTransaction(
    stakerBtcInfo: StakerInfo,
    stakingInput: StakingInputs,
    unsignedStakingTx: Transaction,
    inputUTXOs: UTXO[],
    stakingParamsVersion: number,
  ): Promise<Transaction> {
    const params = getBabylonParamByVersion(stakingParamsVersion, this.stakingParams);
    if (inputUTXOs.length === 0) {
      throw new Error("No input UTXOs provided");
    }

    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const stakingPsbt = staking.toStakingPsbt(
      unsignedStakingTx,
      inputUTXOs,
    );

    const signedStakingPsbtHex = await this.btcProvider.signPsbt(
      SigningStep.STAKING,
      stakingPsbt.toHex()
    );
    return Psbt.fromHex(signedStakingPsbtHex).extractTransaction();
  }

  /**
   * Creates a partial signed unbonding transaction that is only signed by the
   * staker. In order to complete the unbonding transaction, the covenant
   * unbonding signatures need to be added to the transaction before sending it
   * to the BTC network.
   * NOTE: This method should only be used for Babylon phase-1 unbonding.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param stakingInput - The staking inputs.
   * @param stakingParamsVersion - The params version that was used to create the
   * delegation in Babylon chain
   * @param stakingTx - The staking transaction.
   * @returns The partial signed unbonding transaction and its fee.
   */
  async createPartialSignedBtcUnbondingTransaction(
    stakerBtcInfo: StakerInfo,
    stakingInput: StakingInputs,
    stakingParamsVersion: number,
    stakingTx: Transaction,
  ): Promise<TransactionResult> {
    // Get the staking params at the time of the staking transaction
    const params = getBabylonParamByVersion(
      stakingParamsVersion,
      this.stakingParams,
    );
  
    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );
    const {
      transaction: unbondingTx,
      fee,
    } = staking.createUnbondingTransaction(stakingTx);

    const psbt = staking.toUnbondingPsbt(unbondingTx, stakingTx);
    const signedUnbondingPsbtHex = await this.btcProvider.signPsbt(
      SigningStep.UNBONDING,
      psbt.toHex(),
    );
    const signedUnbondingTx = Psbt.fromHex(
      signedUnbondingPsbtHex,
    ).extractTransaction();
  
    return {
      transaction: signedUnbondingTx,
      fee,
    };
  }

  /**
   * Creates a signed unbonding transaction that is ready to be sent to the BTC 
   * network.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param stakingInput - The staking inputs.
   * @param stakingParamsVersion - The params version that was used to create the
   * delegation in Babylon chain
   * @param stakingTx - The staking transaction.
   * @param unsignedUnbondingTx - The unsigned unbonding transaction.
   * @param covenantUnbondingSignatures - The covenant unbonding signatures.
   * It can be retrieved from the Babylon chain or API.
   * @returns The signed unbonding transaction and its fee.
   */
  async createSignedBtcUnbondingTransaction(
    stakerBtcInfo: StakerInfo,
    stakingInput: StakingInputs,
    stakingParamsVersion: number,
    stakingTx: Transaction,
    unsignedUnbondingTx: Transaction,
    covenantUnbondingSignatures: {
      btcPkHex: string;
      sigHex: string;
    }[],
  ): Promise<TransactionResult> {
    // Get the staking params at the time of the staking transaction
    const params = getBabylonParamByVersion(
      stakingParamsVersion,
      this.stakingParams,
    );

    const {
      transaction: signedUnbondingTx,
      fee,
    } = await this.createPartialSignedBtcUnbondingTransaction(
      stakerBtcInfo,
      stakingInput,
      stakingParamsVersion,
      stakingTx,
    );

    // Check the computed txid of the signed unbonding transaction is the same as
    // the txid of the unsigned unbonding transaction
    if (signedUnbondingTx.getId() !== unsignedUnbondingTx.getId()) {
      throw new Error(
        "Unbonding transaction hash does not match the computed hash",
      );
    }

    // Add covenant unbonding signatures
    // Convert the params of covenants to buffer
    const covenantBuffers = params.covenantNoCoordPks.map((covenant) =>
      Buffer.from(covenant, "hex"),
    );
    const witness = createCovenantWitness(
      // Since unbonding transactions always have a single input and output,
      // we expect exactly one signature in TaprootScriptSpendSig when the
      // signing is successful
      signedUnbondingTx.ins[0].witness,
      covenantBuffers,
      covenantUnbondingSignatures,
      params.covenantQuorum,
    );
    // Overwrite the witness to include the covenant unbonding signatures
    signedUnbondingTx.ins[0].witness = witness;

    return {
      transaction: signedUnbondingTx,
      fee,
    };
  }

  /**
   * Creates a signed withdrawal transaction on the unbodning output expiry path 
   * that is ready to be sent to the BTC network.
   * @param stakingInput - The staking inputs.
   * @param stakingParamsVersion - The params version that was used to create the
   * delegation in Babylon chain
   * @param earlyUnbondingTx - The early unbonding transaction.
   * @param feeRate - The fee rate in satoshis per byte. Typical value for the
   * fee rate is above 1. If the fee rate is too low, the transaction will not
   * be included in a block.
   * @returns The signed withdrawal transaction and its fee.
   */
  async createSignedBtcWithdrawEarlyUnbondedTransaction(
    stakerBtcInfo: StakerInfo,
    stakingInput: StakingInputs,
    stakingParamsVersion: number,
    earlyUnbondingTx: Transaction,
    feeRate: number,
  ): Promise<TransactionResult> {
    const params = getBabylonParamByVersion(
      stakingParamsVersion,
      this.stakingParams,
    );

    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { psbt: unbondingPsbt, fee } = staking.createWithdrawEarlyUnbondedTransaction(
      earlyUnbondingTx,
      feeRate,
    );

    const signedWithdrawalPsbtHex = await this.btcProvider.signPsbt(
      SigningStep.WITHDRAW_EARLY_UNBONDED,
      unbondingPsbt.toHex()
    );
    return {
      transaction: Psbt.fromHex(signedWithdrawalPsbtHex).extractTransaction(),
      fee,
    };
  }

  /**
   * Creates a signed withdrawal transaction on the staking output expiry path 
   * that is ready to be sent to the BTC network.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param stakingInput - The staking inputs.
   * @param stakingParamsVersion - The params version that was used to create the
   * delegation in Babylon chain
   * @param stakingTx - The staking transaction.
   * @param feeRate - The fee rate in satoshis per byte. Typical value for the
   * fee rate is above 1. If the fee rate is too low, the transaction will not
   * be included in a block.
   * @returns The signed withdrawal transaction and its fee.
   */
  async createSignedBtcWithdrawStakingExpiredTransaction(
    stakerBtcInfo: StakerInfo,
    stakingInput: StakingInputs,
    stakingParamsVersion: number,
    stakingTx: Transaction,
    feeRate: number,
  ): Promise<TransactionResult> {
    const params = getBabylonParamByVersion(
      stakingParamsVersion,
      this.stakingParams,
    );

    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { psbt, fee } = staking.createWithdrawStakingExpiredPsbt(
      stakingTx,
      feeRate,
    );

    const signedWithdrawalPsbtHex = await this.btcProvider.signPsbt(
      SigningStep.WITHDRAW_STAKING_EXPIRED,
      psbt.toHex()
    );
    return {
      transaction: Psbt.fromHex(signedWithdrawalPsbtHex).extractTransaction(),
      fee,
    };
  }

  /**
   * Creates a signed withdrawal transaction for the expired slashing output that 
   * is ready to be sent to the BTC network.
   * @param stakerBtcInfo - The staker BTC info which includes the BTC address
   * and the no-coord public key in hex format.
   * @param stakingInput - The staking inputs.
   * @param stakingParamsVersion - The params version that was used to create the
   * delegation in Babylon chain
   * @param slashingTx - The slashing transaction.
   * @param feeRate - The fee rate in satoshis per byte. Typical value for the
   * fee rate is above 1. If the fee rate is too low, the transaction will not
   * be included in a block.
   * @returns The signed withdrawal transaction and its fee.
   */
  async createSignedBtcWithdrawSlashingTransaction(
    stakerBtcInfo: StakerInfo,
    stakingInput: StakingInputs,
    stakingParamsVersion: number,
    slashingTx: Transaction,
    feeRate: number,
  ): Promise<TransactionResult> {
    const params = getBabylonParamByVersion(
      stakingParamsVersion,
      this.stakingParams,
    );

    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPkNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { psbt, fee } = staking.createWithdrawSlashingPsbt(
      slashingTx,
      feeRate,
    );

    const signedSlashingPsbtHex = await this.btcProvider.signPsbt(
      SigningStep.WITHDRAW_SLASHING,
      psbt.toHex()
    );
    return {
      transaction: Psbt.fromHex(signedSlashingPsbtHex).extractTransaction(),
      fee,
    };
  }

  /**
   * Creates a proof of possession for the staker based on ECDSA signature.
   * @param bech32Address - The staker's bech32 address on the babylon chain
   * @param stakerBtcAddress - The staker's BTC address.
   * @returns The proof of possession.
   */
  async createProofOfPossession(
    bech32Address: string,
    stakerBtcAddress: string,
  ): Promise<ProofOfPossessionBTC> {
    let sigType: BTCSigType = BTCSigType.ECDSA;

    // For Taproot or Native SegWit addresses, use the BIP322 signature scheme
    // in the proof of possession as it uses the same signature type as the regular
    // input UTXO spend. For legacy addresses, use the ECDSA signature scheme.
    if (
      isTaproot(stakerBtcAddress, this.network) 
        || isNativeSegwit(stakerBtcAddress, this.network)
    ) {
      sigType = BTCSigType.BIP322;
    }

    const signedBabylonAddress = await this.btcProvider.signMessage(
      SigningStep.PROOF_OF_POSSESSION,
      bech32Address,
      sigType === BTCSigType.BIP322 ? "bip322-simple" : "ecdsa",
    );

    let btcSig: Uint8Array;
    if (sigType === BTCSigType.BIP322) {
      const bip322Sig = BIP322Sig.fromPartial({
        address: stakerBtcAddress,
        sig: Buffer.from(signedBabylonAddress, "base64"),
      });
      // Encode the BIP322 protobuf message to a Uint8Array
      btcSig = BIP322Sig.encode(bip322Sig).finish();
    } else {
      // Encode the ECDSA signature to a Uint8Array
      btcSig = Buffer.from(signedBabylonAddress, "base64");
    }

    return {
      btcSigType: sigType,
      btcSig
    };
  }

  /**
   * Creates the unbonding, slashing, and unbonding slashing transactions and 
   * PSBTs.
   * @param stakingInstance - The staking instance.
   * @param stakingTx - The staking transaction.
   * @returns The unbonding, slashing, and unbonding slashing transactions and 
   * PSBTs.
   */
  private async createDelegationTransactionsAndPsbts(
    stakingInstance: Staking,
    stakingTx: Transaction,
  ) {
    const { transaction: unbondingTx } =
    stakingInstance.createUnbondingTransaction(stakingTx);

    // Create slashing transactions and extract signatures
    const { psbt: slashingPsbt } =
      stakingInstance.createStakingOutputSlashingPsbt(stakingTx);

    const { psbt: unbondingSlashingPsbt } =
    stakingInstance.createUnbondingOutputSlashingPsbt(unbondingTx);

    return {
      unbondingTx,
      slashingPsbt,
      unbondingSlashingPsbt,
    };
  }

  /**
   * Creates a protobuf message for the BTC delegation.
   * @param stakingInstance - The staking instance.
   * @param stakingInput - The staking inputs.
   * @param stakingTx - The staking transaction.
   * @param bech32Address - The staker's babylon chain bech32 address
   * @param stakerBtcInfo - The staker's BTC information such as address and 
   * public key
   * @param params - The staking parameters.
   * @param inclusionProof - The inclusion proof of the staking transaction.
   * @returns The protobuf message.
   */
  public async createBtcDelegationMsg(
    stakingInstance: Staking,
    stakingInput: StakingInputs,
    stakingTx: Transaction,
    bech32Address: string,
    stakerBtcInfo: StakerInfo,
    params: StakingParams,
    inclusionProof?: btcstaking.InclusionProof,
  ) {
    const {
      unbondingTx,
      slashingPsbt,
      unbondingSlashingPsbt
    } = await this.createDelegationTransactionsAndPsbts(
      stakingInstance,
      stakingTx,
    );

    // Sign the slashing PSBT
    const signedSlashingPsbtHex = await this.btcProvider.signPsbt(
      SigningStep.STAKING_SLASHING,
      slashingPsbt.toHex(),
    );
    const signedSlashingTx = Psbt.fromHex(
      signedSlashingPsbtHex,
    ).extractTransaction();
    const slashingSig = extractFirstSchnorrSignatureFromTransaction(
      signedSlashingTx
    );
    if (!slashingSig) {
      throw new Error("No signature found in the staking output slashing PSBT");
    }

    // Sign the unbonding slashing PSBT
    const signedUnbondingSlashingPsbtHex = await this.btcProvider.signPsbt(
      SigningStep.UNBONDING_SLASHING,
      unbondingSlashingPsbt.toHex(),
    );
    const signedUnbondingSlashingTx = Psbt.fromHex(
      signedUnbondingSlashingPsbtHex,
    ).extractTransaction();
    const unbondingSignatures = extractFirstSchnorrSignatureFromTransaction(
      signedUnbondingSlashingTx,
    );
    if (!unbondingSignatures) {
      throw new Error("No signature found in the unbonding output slashing PSBT");
    }

    // Create proof of possession
    const proofOfPossession = await this.createProofOfPossession(
      bech32Address,
      stakerBtcInfo.address,
    );

    // Prepare the final protobuf message
    const msg: btcstakingtx.MsgCreateBTCDelegation =
      btcstakingtx.MsgCreateBTCDelegation.fromPartial({
        stakerAddr: bech32Address,
        pop: proofOfPossession,
        btcPk: Uint8Array.from(
          Buffer.from(stakerBtcInfo.publicKeyNoCoordHex, "hex"),
        ),
        fpBtcPkList: [
          Uint8Array.from(
            Buffer.from(stakingInput.finalityProviderPkNoCoordHex, "hex"),
          ),
        ],
        stakingTime: stakingInput.stakingTimelock,
        stakingValue: stakingInput.stakingAmountSat,
        stakingTx: Uint8Array.from(stakingTx.toBuffer()),
        slashingTx: Uint8Array.from(
          Buffer.from(clearTxSignatures(signedSlashingTx).toHex(), "hex"),
        ),
        delegatorSlashingSig: Uint8Array.from(slashingSig),
        unbondingTime: params.unbondingTime,
        unbondingTx: Uint8Array.from(unbondingTx.toBuffer()),
        unbondingValue: stakingInput.stakingAmountSat - params.unbondingFeeSat,
        unbondingSlashingTx: Uint8Array.from(
          Buffer.from(
            clearTxSignatures(signedUnbondingSlashingTx).toHex(),
            "hex",
          ),
        ),
        delegatorUnbondingSlashingSig: Uint8Array.from(unbondingSignatures),
        stakingTxInclusionProof: inclusionProof,
      });

    return {
      typeUrl: BABYLON_REGISTRY_TYPE_URLS.MsgCreateBTCDelegation,
      value: msg,
    };
  };

  /**
   * Gets the inclusion proof for the staking transaction.
   * See the type `InclusionProof` for more information
   * @param inclusionProof - The inclusion proof.
   * @returns The inclusion proof.
   */
  private getInclusionProof(
    inclusionProof: InclusionProof,
  ): btcstaking.InclusionProof {
    const {
      pos,
      merkle,
      blockHashHex
    } = inclusionProof;
    const proofHex = deriveMerkleProof(merkle);
  
    const hash = reverseBuffer(Uint8Array.from(Buffer.from(blockHashHex, "hex")));
    const inclusionProofKey: btccheckpoint.TransactionKey =
      btccheckpoint.TransactionKey.fromPartial({
        index: pos,
        hash,
      });
    return btcstaking.InclusionProof.fromPartial({
      key: inclusionProofKey,
      proof: Uint8Array.from(Buffer.from(proofHex, "hex")),
    });
  };
}

/**
 * Extracts the first valid Schnorr signature from a signed transaction.
 * 
 * Since we only handle transactions with a single input and request a signature
 * for one public key, there can be at most one signature from the Bitcoin node.
 * A valid Schnorr signature is exactly 64 bytes in length.
 * 
 * @param singedTransaction - The signed Bitcoin transaction to extract the signature from
 * @returns The first valid 64-byte Schnorr signature found in the transaction witness data,
 *          or undefined if no valid signature exists
 */
const extractFirstSchnorrSignatureFromTransaction = (
  singedTransaction: Transaction,
): Buffer | undefined => {
  // Loop through each input to extract the witness signature
  for (const input of singedTransaction.ins) {
    if (input.witness && input.witness.length > 0) {
      const schnorrSignature = input.witness[0];

      // Check that it's a 64-byte Schnorr signature
      if (schnorrSignature.length === 64) {
        return schnorrSignature; // Return the first valid signature found
      }
    }
  }
  return undefined;
};

/**
 * Strips all signatures from a transaction by clearing both the script and 
 * witness data. This is due to the fact that we only need the raw unsigned 
 * transaction structure. The signatures are sent in a separate protobuf field 
 * when creating the delegation message in the Babylon.
 * @param tx - The transaction to strip signatures from
 * @returns A copy of the transaction with all signatures removed
 */
const clearTxSignatures = (tx: Transaction): Transaction => {
  tx.ins.forEach((input) => {
    input.script = Buffer.alloc(0);
    input.witness = [];
  });
  return tx;
};

/**
 * Derives the merkle proof from the list of hex strings. Note the
 * sibling hashes are reversed from hex before concatenation.
 * @param merkle - The merkle proof hex strings.
 * @returns The merkle proof in hex string format.
 */
const deriveMerkleProof = (merkle: string[]) => {
  const proofHex = merkle.reduce((acc: string, m: string) => {
    return acc + Buffer.from(m, "hex").reverse().toString("hex");
  }, "");
  return proofHex;
};

/**
 * Get the staker signature from the unbonding transaction
 * This is used mostly for unbonding transactions from phase-1(Observable)
 * @param unbondingTx - The unbonding transaction
 * @returns The staker signature
 */
export const getUnbondingTxStakerSignature = (unbondingTx: Transaction): string => {
  try {
    // There is only one input and one output in the unbonding transaction
    return unbondingTx.ins[0].witness[0].toString("hex");
  } catch (error) {
    throw StakingError.fromUnknown(
      error, StakingErrorCode.INVALID_INPUT,
      "Failed to get staker signature",
    );
  }
};