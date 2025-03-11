import { networks, Transaction } from "bitcoinjs-lib";
import { StakingParams, VersionedStakingParams } from "../types/params";
import { TransactionResult, UTXO } from "../types";
import { StakerInfo, Staking } from ".";
import { btcstaking, btcstakingtx } from "@babylonlabs-io/babylon-proto-ts";
import { ProofOfPossessionBTC } from "@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop";
export interface BtcProvider {
    signPsbt(signingStep: SigningStep, psbtHex: string): Promise<string>;
    signMessage?: (signingStep: SigningStep, message: string, type: "ecdsa") => Promise<string>;
}
export interface BabylonProvider {
    signTransaction: <T extends object>(signingStep: SigningStep, msg: {
        typeUrl: string;
        value: T;
    }) => Promise<Uint8Array>;
}
export declare enum SigningStep {
    STAKING_SLASHING = "staking-slashing",
    UNBONDING_SLASHING = "unbonding-slashing",
    PROOF_OF_POSSESSION = "proof-of-possession",
    CREATE_BTC_DELEGATION_MSG = "create-btc-delegation-msg",
    STAKING = "staking",
    UNBONDING = "unbonding",
    WITHDRAW_STAKING_EXPIRED = "withdraw-staking-expired",
    WITHDRAW_EARLY_UNBONDED = "withdraw-early-unbonded",
    WITHDRAW_SLASHING = "withdraw-slashing"
}
interface StakingInputs {
    finalityProviderPkNoCoordHex: string;
    stakingAmountSat: number;
    stakingTimelock: number;
}
interface InclusionProof {
    pos: number;
    merkle: string[];
    blockHashHex: string;
}
export declare class BabylonBtcStakingManager {
    private stakingParams;
    private btcProvider;
    private network;
    private babylonProvider;
    constructor(network: networks.Network, stakingParams: VersionedStakingParams[], btcProvider: BtcProvider, babylonProvider: BabylonProvider);
    /**
     * Creates a signed Pre-Staking Registration transaction that is ready to be
     * sent to the Babylon chain.
     * @param stakerBtcInfo - The staker BTC info which includes the BTC address
     * and the no-coord public key in hex format.
     * @param stakingInput - The staking inputs.
     * @param babylonBtcTipHeight - The Babylon BTC tip height.
     * @param inputUTXOs - The UTXOs that will be used to pay for the staking
     * transaction.
     * @param feeRate - The fee rate in satoshis per byte.
     * @param babylonAddress - The Babylon bech32 encoded address of the staker.
     * @returns The signed babylon pre-staking registration transaction in base64
     * format.
     */
    preStakeRegistrationBabylonTransaction(stakerBtcInfo: StakerInfo, stakingInput: StakingInputs, babylonBtcTipHeight: number, inputUTXOs: UTXO[], feeRate: number, babylonAddress: string): Promise<{
        signedBabylonTx: Uint8Array;
        stakingTx: Transaction;
    }>;
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
     * @param inclusionProof - The inclusion proof of the staking transaction.
     * @param babylonAddress - The Babylon bech32 encoded address of the staker.
     * @returns The signed babylon transaction in base64 format.
     */
    postStakeRegistrationBabylonTransaction(stakerBtcInfo: StakerInfo, stakingTx: Transaction, stakingTxHeight: number, stakingInput: StakingInputs, inclusionProof: InclusionProof, babylonAddress: string): Promise<{
        signedBabylonTx: Uint8Array;
    }>;
    /**
     * Estimates the BTC fee required for staking.
     * @param stakerBtcInfo - The staker BTC info which includes the BTC address
     * and the no-coord public key in hex format.
     * @param babylonBtcTipHeight - The BTC tip height recorded on the Babylon
     * chain.
     * @param stakingInput - The staking inputs.
     * @param inputUTXOs - The UTXOs that will be used to pay for the staking
     * transaction.
     * @param feeRate - The fee rate in satoshis per byte.
     * @returns The estimated BTC fee in satoshis.
     */
    estimateBtcStakingFee(stakerBtcInfo: StakerInfo, babylonBtcTipHeight: number, stakingInput: StakingInputs, inputUTXOs: UTXO[], feeRate: number): number;
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
    createSignedBtcStakingTransaction(stakerBtcInfo: StakerInfo, stakingInput: StakingInputs, unsignedStakingTx: Transaction, inputUTXOs: UTXO[], stakingParamsVersion: number): Promise<Transaction>;
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
    createPartialSignedBtcUnbondingTransaction(stakerBtcInfo: StakerInfo, stakingInput: StakingInputs, stakingParamsVersion: number, stakingTx: Transaction): Promise<TransactionResult>;
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
    createSignedBtcUnbondingTransaction(stakerBtcInfo: StakerInfo, stakingInput: StakingInputs, stakingParamsVersion: number, stakingTx: Transaction, unsignedUnbondingTx: Transaction, covenantUnbondingSignatures: {
        btcPkHex: string;
        sigHex: string;
    }[]): Promise<TransactionResult>;
    /**
     * Creates a signed withdrawal transaction on the unbodning output expiry path
     * that is ready to be sent to the BTC network.
     * @param stakingInput - The staking inputs.
     * @param stakingParamsVersion - The params version that was used to create the
     * delegation in Babylon chain
     * @param earlyUnbondingTx - The early unbonding transaction.
     * @param feeRate - The fee rate in satoshis per byte.
     * @returns The signed withdrawal transaction and its fee.
     */
    createSignedBtcWithdrawEarlyUnbondedTransaction(stakerBtcInfo: StakerInfo, stakingInput: StakingInputs, stakingParamsVersion: number, earlyUnbondingTx: Transaction, feeRate: number): Promise<TransactionResult>;
    /**
     * Creates a signed withdrawal transaction on the staking output expiry path
     * that is ready to be sent to the BTC network.
     * @param stakerBtcInfo - The staker BTC info which includes the BTC address
     * and the no-coord public key in hex format.
     * @param stakingInput - The staking inputs.
     * @param stakingParamsVersion - The params version that was used to create the
     * delegation in Babylon chain
     * @param stakingTx - The staking transaction.
     * @param feeRate - The fee rate in satoshis per byte.
     * @returns The signed withdrawal transaction and its fee.
     */
    createSignedBtcWithdrawStakingExpiredTransaction(stakerBtcInfo: StakerInfo, stakingInput: StakingInputs, stakingParamsVersion: number, stakingTx: Transaction, feeRate: number): Promise<TransactionResult>;
    /**
     * Creates a signed withdrawal transaction for the expired slashing output that
     * is ready to be sent to the BTC network.
     * @param stakerBtcInfo - The staker BTC info which includes the BTC address
     * and the no-coord public key in hex format.
     * @param stakingInput - The staking inputs.
     * @param stakingParamsVersion - The params version that was used to create the
     * delegation in Babylon chain
     * @param slashingTx - The slashing transaction.
     * @param feeRate - The fee rate in satoshis per byte.
     * @returns The signed withdrawal transaction and its fee.
     */
    createSignedBtcWithdrawSlashingTransaction(stakerBtcInfo: StakerInfo, stakingInput: StakingInputs, stakingParamsVersion: number, slashingTx: Transaction, feeRate: number): Promise<TransactionResult>;
    /**
     * Creates a proof of possession for the staker based on ECDSA signature.
     * @param bech32Address - The staker's bech32 address.
     * @returns The proof of possession.
     */
    createProofOfPossession(bech32Address: string): Promise<ProofOfPossessionBTC>;
    /**
     * Creates the unbonding, slashing, and unbonding slashing transactions and
     * PSBTs.
     * @param stakingInstance - The staking instance.
     * @param stakingTx - The staking transaction.
     * @returns The unbonding, slashing, and unbonding slashing transactions and
     * PSBTs.
     */
    private createDelegationTransactionsAndPsbts;
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
    createBtcDelegationMsg(stakingInstance: Staking, stakingInput: StakingInputs, stakingTx: Transaction, bech32Address: string, stakerBtcInfo: StakerInfo, params: StakingParams, inclusionProof?: btcstaking.InclusionProof): Promise<{
        typeUrl: string;
        value: btcstakingtx.MsgCreateBTCDelegation;
    }>;
    /**
     * Gets the inclusion proof for the staking transaction.
     * See the type `InclusionProof` for more information
     * @param inclusionProof - The inclusion proof.
     * @returns The inclusion proof.
     */
    private getInclusionProof;
}
/**
 * Get the staker signature from the unbonding transaction
 * This is used mostly for unbonding transactions from phase-1(Observable)
 * @param unbondingTx - The unbonding transaction
 * @returns The staker signature
 */
export declare const getUnbondingTxStakerSignature: (unbondingTx: Transaction) => string;
export {};
