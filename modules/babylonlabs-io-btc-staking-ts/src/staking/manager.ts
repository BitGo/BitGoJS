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
import { Psbt, Transaction, networks } from "bitcoinjs-lib";
import type { Emitter } from "nanoevents";

import { StakerInfo, Staking } from ".";
import { BABYLON_REGISTRY_TYPE_URLS } from "../constants/registry";
import { StakingError, StakingErrorCode } from "../error";
import { TransactionResult, UTXO } from "../types";
import { ActionName } from "../types/action";
import { Contract, ContractId } from "../types/contract";
import { ManagerEvents } from "../types/events";
import {
  BabylonProvider,
  BtcProvider,
  InclusionProof,
  StakingInputs,
} from "../types/manager";
import { StakingParams, VersionedStakingParams } from "../types/params";
import { reverseBuffer } from "../utils";
import { isValidBabylonAddress } from "../utils/babylon";
import { isNativeSegwit, isTaproot } from "../utils/btc";
import {
  deriveStakingOutputInfo,
  findMatchingTxOutputIndex,
} from "../utils/staking";
import {
  getBabylonParamByBtcHeight,
  getBabylonParamByVersion,
} from "../utils/staking/param";
import { createCovenantWitness } from "./transactions";

export class BabylonBtcStakingManager {
  constructor(
    protected network: networks.Network,
    protected stakingParams: VersionedStakingParams[],
    protected btcProvider: BtcProvider,
    protected babylonProvider: BabylonProvider,
    protected ee?: Emitter<ManagerEvents>
  ) {
    this.network = network;

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
      stakingInput.finalityProviderPksNoCoordHex,
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
      "delegation:create",
      staking,
      stakingInput,
      transaction,
      babylonAddress,
      stakerBtcInfo,
      params,
    );

    this.ee?.emit("delegation:create", {
      type: "create-btc-delegation-msg",
    });

    return {
      signedBabylonTx: await this.babylonProvider.signTransaction(msg),
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
    const params = getBabylonParamByBtcHeight(
      stakingTxHeight,
      this.stakingParams,
    );

    if (!isValidBabylonAddress(babylonAddress)) {
      throw new Error("Invalid Babylon address");
    }

    const stakingInstance = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPksNoCoordHex,
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
    );

    // Create delegation message
    const delegationMsg = await this.createBtcDelegationMsg(
      "delegation:register",
      stakingInstance,
      stakingInput,
      stakingTx,
      babylonAddress,
      stakerBtcInfo,
      params,
      this.getInclusionProof(inclusionProof),
    );

    this.ee?.emit("delegation:register", {
      type: "create-btc-delegation-msg",
    });

    return {
      signedBabylonTx:
        await this.babylonProvider.signTransaction(delegationMsg),
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
      stakingInput.finalityProviderPksNoCoordHex,
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
    const params = getBabylonParamByVersion(
      stakingParamsVersion,
      this.stakingParams,
    );

    if (inputUTXOs.length === 0) {
      throw new Error("No input UTXOs provided");
    }

    const staking = new Staking(
      this.network,
      stakerBtcInfo,
      params,
      stakingInput.finalityProviderPksNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const stakingPsbt = staking.toStakingPsbt(unsignedStakingTx, inputUTXOs);

    const contracts: Contract[] = [
      {
        id: ContractId.STAKING,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
          covenantPks: params.covenantNoCoordPks,
          covenantThreshold: params.covenantQuorum,
          minUnbondingTime: params.unbondingTime,
          stakingDuration: stakingInput.stakingTimelock,
        },
      },
    ];

    this.ee?.emit("delegation:stake", {
      stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
      finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
      covenantPks: params.covenantNoCoordPks,
      covenantThreshold: params.covenantQuorum,
      unbondingTimeBlocks: params.unbondingTime,
      stakingDuration: stakingInput.stakingTimelock,
      type: "staking",
    });

    const signedStakingPsbtHex = await this.btcProvider.signPsbt(
      stakingPsbt.toHex(),
      {
        contracts,
        action: {
          name: ActionName.SIGN_BTC_STAKING_TRANSACTION,
        },
      },
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
      stakingInput.finalityProviderPksNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { transaction: unbondingTx, fee } =
      staking.createUnbondingTransaction(stakingTx);

    const psbt = staking.toUnbondingPsbt(unbondingTx, stakingTx);

    const contracts: Contract[] = [
      {
        id: ContractId.STAKING,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
          covenantPks: params.covenantNoCoordPks,
          covenantThreshold: params.covenantQuorum,
          minUnbondingTime: params.unbondingTime,
          stakingDuration: stakingInput.stakingTimelock,
        },
      },
      {
        id: ContractId.UNBONDING,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
          covenantPks: params.covenantNoCoordPks,
          covenantThreshold: params.covenantQuorum,
          unbondingTimeBlocks: params.unbondingTime,
          unbondingFeeSat: params.unbondingFeeSat,
        },
      },
    ];

    this.ee?.emit("delegation:unbond", {
      stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
      finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
      covenantPks: params.covenantNoCoordPks,
      covenantThreshold: params.covenantQuorum,
      stakingDuration: stakingInput.stakingTimelock,
      unbondingTimeBlocks: params.unbondingTime,
      unbondingFeeSat: params.unbondingFeeSat,
      type: "unbonding",
    });

    const signedUnbondingPsbtHex = await this.btcProvider.signPsbt(
      psbt.toHex(),
      {
        contracts,
        action: {
          name: ActionName.SIGN_BTC_UNBONDING_TRANSACTION,
        },
      },
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

    const { transaction: signedUnbondingTx, fee } =
      await this.createPartialSignedBtcUnbondingTransaction(
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
      stakingInput.finalityProviderPksNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { psbt: unbondingPsbt, fee } =
      staking.createWithdrawEarlyUnbondedTransaction(earlyUnbondingTx, feeRate);

    const contracts: Contract[] = [
      {
        id: ContractId.WITHDRAW,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          timelockBlocks: params.unbondingTime,
        },
      },
    ];

    this.ee?.emit("delegation:withdraw", {
      stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
      timelockBlocks: params.unbondingTime,
      type: "early-unbonded",
    });

    const signedWithdrawalPsbtHex = await this.btcProvider.signPsbt(
      unbondingPsbt.toHex(),
      {
        contracts,
        action: {
          name: ActionName.SIGN_BTC_WITHDRAW_TRANSACTION,
        },
      },
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
      stakingInput.finalityProviderPksNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { psbt, fee } = staking.createWithdrawStakingExpiredPsbt(
      stakingTx,
      feeRate,
    );

    const contracts: Contract[] = [
      {
        id: ContractId.WITHDRAW,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          timelockBlocks: stakingInput.stakingTimelock,
        },
      },
    ];

    this.ee?.emit("delegation:withdraw", {
      stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
      timelockBlocks: stakingInput.stakingTimelock,
      type: "staking-expired",
    });

    const signedWithdrawalPsbtHex = await this.btcProvider.signPsbt(
      psbt.toHex(),
      {
        contracts,
        action: {
          name: ActionName.SIGN_BTC_WITHDRAW_TRANSACTION,
        },
      },
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
      stakingInput.finalityProviderPksNoCoordHex,
      stakingInput.stakingTimelock,
    );

    const { psbt, fee } = staking.createWithdrawSlashingPsbt(
      slashingTx,
      feeRate,
    );

    const contracts: Contract[] = [
      {
        id: ContractId.WITHDRAW,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          timelockBlocks: params.unbondingTime,
        },
      },
    ];

    this.ee?.emit("delegation:withdraw", {
      stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
      timelockBlocks: params.unbondingTime,
      type: "slashing",
    });

    const signedWithrawSlashingPsbtHex = await this.btcProvider.signPsbt(
      psbt.toHex(),
      {
        contracts,
        action: {
          name: ActionName.SIGN_BTC_WITHDRAW_TRANSACTION,
        },
      },
    );

    return {
      transaction: Psbt.fromHex(
        signedWithrawSlashingPsbtHex,
      ).extractTransaction(),
      fee,
    };
  }

  /**
   * Creates a proof of possession for the staker based on ECDSA signature.
   * @param bech32Address - The staker's bech32 address.
   * @returns The proof of possession.
   */
  async createProofOfPossession(
    channel: "delegation:create" | "delegation:register",
    bech32Address: string,
    stakerBtcAddress: string,
  ): Promise<ProofOfPossessionBTC> {
    let sigType: BTCSigType = BTCSigType.ECDSA;

    // For Taproot or Native SegWit addresses, use the BIP322 signature scheme
    // in the proof of possession as it uses the same signature type as the regular
    // input UTXO spend. For legacy addresses, use the ECDSA signature scheme.
    if (
      isTaproot(stakerBtcAddress, this.network) ||
      isNativeSegwit(stakerBtcAddress, this.network)
    ) {
      sigType = BTCSigType.BIP322;
    }

    this.ee?.emit(channel, {
      bech32Address,
      type: "proof-of-possession",
    });

    const signedBabylonAddress = await this.btcProvider.signMessage(
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
      btcSig,
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
  private async createBtcDelegationMsg(
    channel: "delegation:create" | "delegation:register",
    stakingInstance: Staking,
    stakingInput: StakingInputs,
    stakingTx: Transaction,
    bech32Address: string,
    stakerBtcInfo: StakerInfo,
    params: StakingParams,
    inclusionProof?: btcstaking.InclusionProof,
  ) {
    if (!params.slashing) {
      throw new StakingError(
        StakingErrorCode.INVALID_PARAMS,
        "Slashing parameters are required for creating delegation message",
      );
    }

    const { unbondingTx, slashingPsbt, unbondingSlashingPsbt } =
      await this.createDelegationTransactionsAndPsbts(
        stakingInstance,
        stakingTx,
      );

    const slashingContracts: Contract[] = [
      {
        id: ContractId.STAKING,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
          covenantPks: params.covenantNoCoordPks,
          covenantThreshold: params.covenantQuorum,
          minUnbondingTime: params.unbondingTime,
          stakingDuration: stakingInput.stakingTimelock,
        },
      },
      {
        id: ContractId.SLASHING,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          unbondingTimeBlocks: params.unbondingTime,
          slashingFeeSat: params.slashing.minSlashingTxFeeSat,
        },
      },
      {
        id: ContractId.SLASHING_BURN,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          slashingPkScriptHex: params.slashing.slashingPkScriptHex,
        },
      },
    ];

    // Sign the slashing PSBT
    this.ee?.emit(channel, {
      stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
      finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
      covenantPks: params.covenantNoCoordPks,
      covenantThreshold: params.covenantQuorum,
      unbondingTimeBlocks: params.unbondingTime,
      stakingDuration: stakingInput.stakingTimelock,
      slashingFeeSat: params.slashing.minSlashingTxFeeSat,
      slashingPkScriptHex: params.slashing.slashingPkScriptHex,
      type: "staking-slashing",
    });

    const signedSlashingPsbtHex = await this.btcProvider.signPsbt(
      slashingPsbt.toHex(),
      {
        contracts: slashingContracts,
        action: {
          name: ActionName.SIGN_BTC_SLASHING_TRANSACTION,
        },
      },
    );

    const signedSlashingTx = Psbt.fromHex(
      signedSlashingPsbtHex,
    ).extractTransaction();
    const slashingSig =
      extractFirstSchnorrSignatureFromTransaction(signedSlashingTx);
    if (!slashingSig) {
      throw new Error("No signature found in the staking output slashing PSBT");
    }

    const unbondingSlashingContracts: Contract[] = [
      {
        id: ContractId.UNBONDING,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
          covenantPks: params.covenantNoCoordPks,
          covenantThreshold: params.covenantQuorum,
          unbondingTimeBlocks: params.unbondingTime,
          unbondingFeeSat: params.unbondingFeeSat,
        },
      },
      {
        id: ContractId.SLASHING,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          unbondingTimeBlocks: params.unbondingTime,
          slashingFeeSat: params.slashing.minSlashingTxFeeSat,
        },
      },
      {
        id: ContractId.SLASHING_BURN,
        params: {
          stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
          slashingPkScriptHex: params.slashing.slashingPkScriptHex,
        },
      },
    ];

    // Sign the unbonding slashing PSBT
    this.ee?.emit(channel, {
      stakerPk: stakerBtcInfo.publicKeyNoCoordHex,
      finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
      covenantPks: params.covenantNoCoordPks,
      covenantThreshold: params.covenantQuorum,
      unbondingTimeBlocks: params.unbondingTime,
      unbondingFeeSat: params.unbondingFeeSat,
      slashingFeeSat: params.slashing.minSlashingTxFeeSat,
      slashingPkScriptHex: params.slashing.slashingPkScriptHex,
      type: "unbonding-slashing",
    });

    const signedUnbondingSlashingPsbtHex = await this.btcProvider.signPsbt(
      unbondingSlashingPsbt.toHex(),
      {
        contracts: unbondingSlashingContracts,
        action: {
          name: ActionName.SIGN_BTC_UNBONDING_SLASHING_TRANSACTION,
        },
      },
    );

    const signedUnbondingSlashingTx = Psbt.fromHex(
      signedUnbondingSlashingPsbtHex,
    ).extractTransaction();
    const unbondingSignatures = extractFirstSchnorrSignatureFromTransaction(
      signedUnbondingSlashingTx,
    );
    if (!unbondingSignatures) {
      throw new Error(
        "No signature found in the unbonding output slashing PSBT",
      );
    }

    // Create proof of possession
    const proofOfPossession = await this.createProofOfPossession(
      channel,
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
        fpBtcPkList: stakingInput.finalityProviderPksNoCoordHex.map((pk) =>
          Uint8Array.from(Buffer.from(pk, "hex")),
        ),
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
  }

  /**
   * Gets the inclusion proof for the staking transaction.
   * See the type `InclusionProof` for more information
   * @param inclusionProof - The inclusion proof.
   * @returns The inclusion proof.
   */
  private getInclusionProof(
    inclusionProof: InclusionProof,
  ): btcstaking.InclusionProof {
    const { pos, merkle, blockHashHex } = inclusionProof;
    const proofHex = deriveMerkleProof(merkle);

    const hash = reverseBuffer(
      Uint8Array.from(Buffer.from(blockHashHex, "hex")),
    );
    const inclusionProofKey: btccheckpoint.TransactionKey =
      btccheckpoint.TransactionKey.fromPartial({
        index: pos,
        hash,
      });
    return btcstaking.InclusionProof.fromPartial({
      key: inclusionProofKey,
      proof: Uint8Array.from(Buffer.from(proofHex, "hex")),
    });
  }
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
export const getUnbondingTxStakerSignature = (
  unbondingTx: Transaction,
): string => {
  try {
    // There is only one input and one output in the unbonding transaction
    return unbondingTx.ins[0].witness[0].toString("hex");
  } catch (error) {
    throw StakingError.fromUnknown(
      error,
      StakingErrorCode.INVALID_INPUT,
      "Failed to get staker signature",
    );
  }
};
