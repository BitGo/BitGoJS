"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnbondingTxStakerSignature = exports.BabylonBtcStakingManager = exports.SigningStep = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const _1 = require(".");
const encoding_1 = require("@cosmjs/encoding");
const babylon_proto_ts_1 = require("@babylonlabs-io/babylon-proto-ts");
const pop_1 = require("@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop");
const registry_1 = require("../constants/registry");
const transactions_1 = require("./transactions");
const param_1 = require("../utils/staking/param");
const utils_1 = require("../utils");
const staking_1 = require("../utils/staking");
const staking_2 = require("../utils/staking");
const babylon_1 = require("../utils/babylon");
const error_1 = require("../error");
const error_2 = require("../error");
// Event types for the Signing event
var SigningStep;
(function (SigningStep) {
    SigningStep["STAKING_SLASHING"] = "staking-slashing";
    SigningStep["UNBONDING_SLASHING"] = "unbonding-slashing";
    SigningStep["PROOF_OF_POSSESSION"] = "proof-of-possession";
    SigningStep["CREATE_BTC_DELEGATION_MSG"] = "create-btc-delegation-msg";
    SigningStep["STAKING"] = "staking";
    SigningStep["UNBONDING"] = "unbonding";
    SigningStep["WITHDRAW_STAKING_EXPIRED"] = "withdraw-staking-expired";
    SigningStep["WITHDRAW_EARLY_UNBONDED"] = "withdraw-early-unbonded";
    SigningStep["WITHDRAW_SLASHING"] = "withdraw-slashing";
})(SigningStep || (exports.SigningStep = SigningStep = {}));
class BabylonBtcStakingManager {
    constructor(network, stakingParams, btcProvider, babylonProvider) {
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
     * @param feeRate - The fee rate in satoshis per byte.
     * @param babylonAddress - The Babylon bech32 encoded address of the staker.
     * @returns The signed babylon pre-staking registration transaction in base64
     * format.
     */
    preStakeRegistrationBabylonTransaction(stakerBtcInfo, stakingInput, babylonBtcTipHeight, inputUTXOs, feeRate, babylonAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (babylonBtcTipHeight === 0) {
                throw new Error("Babylon BTC tip height cannot be 0");
            }
            if (inputUTXOs.length === 0) {
                throw new Error("No input UTXOs provided");
            }
            if (!(0, babylon_1.isValidBabylonAddress)(babylonAddress)) {
                throw new Error("Invalid Babylon address");
            }
            // Get the Babylon params based on the BTC tip height from Babylon chain
            const params = (0, param_1.getBabylonParamByBtcHeight)(babylonBtcTipHeight, this.stakingParams);
            const staking = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
            // Create unsigned staking transaction
            const { transaction } = staking.createStakingTransaction(stakingInput.stakingAmountSat, inputUTXOs, feeRate);
            // Create delegation message without including inclusion proof
            const msg = yield this.createBtcDelegationMsg(staking, stakingInput, transaction, babylonAddress, stakerBtcInfo, params);
            return {
                signedBabylonTx: yield this.babylonProvider.signTransaction(SigningStep.CREATE_BTC_DELEGATION_MSG, msg),
                stakingTx: transaction,
            };
        });
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
     * @param inclusionProof - The inclusion proof of the staking transaction.
     * @param babylonAddress - The Babylon bech32 encoded address of the staker.
     * @returns The signed babylon transaction in base64 format.
     */
    postStakeRegistrationBabylonTransaction(stakerBtcInfo, stakingTx, stakingTxHeight, stakingInput, inclusionProof, babylonAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the Babylon params at the time of the staking transaction
            const params = (0, param_1.getBabylonParamByBtcHeight)(stakingTxHeight, this.stakingParams);
            if (!(0, babylon_1.isValidBabylonAddress)(babylonAddress)) {
                throw new Error("Invalid Babylon address");
            }
            const stakingInstance = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
            // Validate if the stakingTx is valid based on the retrieved Babylon param
            const scripts = stakingInstance.buildScripts();
            const stakingOutputInfo = (0, staking_1.deriveStakingOutputInfo)(scripts, this.network);
            // Error will be thrown if the expected staking output address is not found
            // in the stakingTx
            (0, staking_2.findMatchingTxOutputIndex)(stakingTx, stakingOutputInfo.outputAddress, this.network);
            // Create delegation message
            const delegationMsg = yield this.createBtcDelegationMsg(stakingInstance, stakingInput, stakingTx, babylonAddress, stakerBtcInfo, params, this.getInclusionProof(inclusionProof));
            return {
                signedBabylonTx: yield this.babylonProvider.signTransaction(SigningStep.CREATE_BTC_DELEGATION_MSG, delegationMsg),
            };
        });
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
     * @param feeRate - The fee rate in satoshis per byte.
     * @returns The estimated BTC fee in satoshis.
     */
    estimateBtcStakingFee(stakerBtcInfo, babylonBtcTipHeight, stakingInput, inputUTXOs, feeRate) {
        if (babylonBtcTipHeight === 0) {
            throw new Error("Babylon BTC tip height cannot be 0");
        }
        // Get the param based on the tip height
        const params = (0, param_1.getBabylonParamByBtcHeight)(babylonBtcTipHeight, this.stakingParams);
        const staking = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
        const { fee: stakingFee } = staking.createStakingTransaction(stakingInput.stakingAmountSat, inputUTXOs, feeRate);
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
    createSignedBtcStakingTransaction(stakerBtcInfo, stakingInput, unsignedStakingTx, inputUTXOs, stakingParamsVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = (0, param_1.getBabylonParamByVersion)(stakingParamsVersion, this.stakingParams);
            if (inputUTXOs.length === 0) {
                throw new Error("No input UTXOs provided");
            }
            const staking = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
            const stakingPsbt = staking.toStakingPsbt(unsignedStakingTx, inputUTXOs);
            const signedStakingPsbtHex = yield this.btcProvider.signPsbt(SigningStep.STAKING, stakingPsbt.toHex());
            return bitcoinjs_lib_1.Psbt.fromHex(signedStakingPsbtHex).extractTransaction();
        });
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
    createPartialSignedBtcUnbondingTransaction(stakerBtcInfo, stakingInput, stakingParamsVersion, stakingTx) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the staking params at the time of the staking transaction
            const params = (0, param_1.getBabylonParamByVersion)(stakingParamsVersion, this.stakingParams);
            const staking = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
            const { transaction: unbondingTx, fee, } = staking.createUnbondingTransaction(stakingTx);
            const psbt = staking.toUnbondingPsbt(unbondingTx, stakingTx);
            const signedUnbondingPsbtHex = yield this.btcProvider.signPsbt(SigningStep.UNBONDING, psbt.toHex());
            const signedUnbondingTx = bitcoinjs_lib_1.Psbt.fromHex(signedUnbondingPsbtHex).extractTransaction();
            return {
                transaction: signedUnbondingTx,
                fee,
            };
        });
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
    createSignedBtcUnbondingTransaction(stakerBtcInfo, stakingInput, stakingParamsVersion, stakingTx, unsignedUnbondingTx, covenantUnbondingSignatures) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the staking params at the time of the staking transaction
            const params = (0, param_1.getBabylonParamByVersion)(stakingParamsVersion, this.stakingParams);
            const { transaction: signedUnbondingTx, fee, } = yield this.createPartialSignedBtcUnbondingTransaction(stakerBtcInfo, stakingInput, stakingParamsVersion, stakingTx);
            // Check the computed txid of the signed unbonding transaction is the same as
            // the txid of the unsigned unbonding transaction
            if (signedUnbondingTx.getId() !== unsignedUnbondingTx.getId()) {
                throw new Error("Unbonding transaction hash does not match the computed hash");
            }
            // Add covenant unbonding signatures
            // Convert the params of covenants to buffer
            const covenantBuffers = params.covenantNoCoordPks.map((covenant) => Buffer.from(covenant, "hex"));
            const witness = (0, transactions_1.createCovenantWitness)(
            // Since unbonding transactions always have a single input and output,
            // we expect exactly one signature in TaprootScriptSpendSig when the
            // signing is successful
            signedUnbondingTx.ins[0].witness, covenantBuffers, covenantUnbondingSignatures, params.covenantQuorum);
            // Overwrite the witness to include the covenant unbonding signatures
            signedUnbondingTx.ins[0].witness = witness;
            return {
                transaction: signedUnbondingTx,
                fee,
            };
        });
    }
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
    createSignedBtcWithdrawEarlyUnbondedTransaction(stakerBtcInfo, stakingInput, stakingParamsVersion, earlyUnbondingTx, feeRate) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = (0, param_1.getBabylonParamByVersion)(stakingParamsVersion, this.stakingParams);
            const staking = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
            const { psbt: unbondingPsbt, fee } = staking.createWithdrawEarlyUnbondedTransaction(earlyUnbondingTx, feeRate);
            const signedWithdrawalPsbtHex = yield this.btcProvider.signPsbt(SigningStep.WITHDRAW_EARLY_UNBONDED, unbondingPsbt.toHex());
            return {
                transaction: bitcoinjs_lib_1.Psbt.fromHex(signedWithdrawalPsbtHex).extractTransaction(),
                fee,
            };
        });
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
     * @param feeRate - The fee rate in satoshis per byte.
     * @returns The signed withdrawal transaction and its fee.
     */
    createSignedBtcWithdrawStakingExpiredTransaction(stakerBtcInfo, stakingInput, stakingParamsVersion, stakingTx, feeRate) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = (0, param_1.getBabylonParamByVersion)(stakingParamsVersion, this.stakingParams);
            const staking = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
            const { psbt, fee } = staking.createWithdrawStakingExpiredPsbt(stakingTx, feeRate);
            const signedWithdrawalPsbtHex = yield this.btcProvider.signPsbt(SigningStep.WITHDRAW_STAKING_EXPIRED, psbt.toHex());
            return {
                transaction: bitcoinjs_lib_1.Psbt.fromHex(signedWithdrawalPsbtHex).extractTransaction(),
                fee,
            };
        });
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
     * @param feeRate - The fee rate in satoshis per byte.
     * @returns The signed withdrawal transaction and its fee.
     */
    createSignedBtcWithdrawSlashingTransaction(stakerBtcInfo, stakingInput, stakingParamsVersion, slashingTx, feeRate) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = (0, param_1.getBabylonParamByVersion)(stakingParamsVersion, this.stakingParams);
            const staking = new _1.Staking(this.network, stakerBtcInfo, params, stakingInput.finalityProviderPkNoCoordHex, stakingInput.stakingTimelock);
            const { psbt, fee } = staking.createWithdrawSlashingPsbt(slashingTx, feeRate);
            const signedSlashingPsbtHex = yield this.btcProvider.signPsbt(SigningStep.WITHDRAW_SLASHING, psbt.toHex());
            return {
                transaction: bitcoinjs_lib_1.Psbt.fromHex(signedSlashingPsbtHex).extractTransaction(),
                fee,
            };
        });
    }
    /**
     * Creates a proof of possession for the staker based on ECDSA signature.
     * @param bech32Address - The staker's bech32 address.
     * @returns The proof of possession.
     */
    createProofOfPossession(bech32Address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.btcProvider.signMessage) {
                throw new Error("Sign message function not found");
            }
            // Create Proof of Possession
            const bech32AddressHex = (0, utils_1.uint8ArrayToHex)((0, encoding_1.fromBech32)(bech32Address).data);
            const signedBabylonAddress = yield this.btcProvider.signMessage(SigningStep.PROOF_OF_POSSESSION, bech32AddressHex, "ecdsa");
            const ecdsaSig = Uint8Array.from(Buffer.from(signedBabylonAddress, "base64"));
            return {
                btcSigType: pop_1.BTCSigType.ECDSA,
                btcSig: ecdsaSig,
            };
        });
    }
    /**
     * Creates the unbonding, slashing, and unbonding slashing transactions and
     * PSBTs.
     * @param stakingInstance - The staking instance.
     * @param stakingTx - The staking transaction.
     * @returns The unbonding, slashing, and unbonding slashing transactions and
     * PSBTs.
     */
    createDelegationTransactionsAndPsbts(stakingInstance, stakingTx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { transaction: unbondingTx } = stakingInstance.createUnbondingTransaction(stakingTx);
            // Create slashing transactions and extract signatures
            const { psbt: slashingPsbt } = stakingInstance.createStakingOutputSlashingPsbt(stakingTx);
            const { psbt: unbondingSlashingPsbt } = stakingInstance.createUnbondingOutputSlashingPsbt(unbondingTx);
            return {
                unbondingTx,
                slashingPsbt,
                unbondingSlashingPsbt,
            };
        });
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
    createBtcDelegationMsg(stakingInstance, stakingInput, stakingTx, bech32Address, stakerBtcInfo, params, inclusionProof) {
        return __awaiter(this, void 0, void 0, function* () {
            const { unbondingTx, slashingPsbt, unbondingSlashingPsbt } = yield this.createDelegationTransactionsAndPsbts(stakingInstance, stakingTx);
            // Sign the slashing PSBT
            const signedSlashingPsbtHex = yield this.btcProvider.signPsbt(SigningStep.STAKING_SLASHING, slashingPsbt.toHex());
            const signedSlashingTx = bitcoinjs_lib_1.Psbt.fromHex(signedSlashingPsbtHex).extractTransaction();
            const slashingSig = extractFirstSchnorrSignatureFromTransaction(signedSlashingTx);
            if (!slashingSig) {
                throw new Error("No signature found in the staking output slashing PSBT");
            }
            // Sign the unbonding slashing PSBT
            const signedUnbondingSlashingPsbtHex = yield this.btcProvider.signPsbt(SigningStep.UNBONDING_SLASHING, unbondingSlashingPsbt.toHex());
            const signedUnbondingSlashingTx = bitcoinjs_lib_1.Psbt.fromHex(signedUnbondingSlashingPsbtHex).extractTransaction();
            const unbondingSignatures = extractFirstSchnorrSignatureFromTransaction(signedUnbondingSlashingTx);
            if (!unbondingSignatures) {
                throw new Error("No signature found in the unbonding output slashing PSBT");
            }
            // Create proof of possession
            const proofOfPossession = yield this.createProofOfPossession(bech32Address);
            // Prepare the final protobuf message
            const msg = babylon_proto_ts_1.btcstakingtx.MsgCreateBTCDelegation.fromPartial({
                stakerAddr: bech32Address,
                pop: proofOfPossession,
                btcPk: Uint8Array.from(Buffer.from(stakerBtcInfo.publicKeyNoCoordHex, "hex")),
                fpBtcPkList: [
                    Uint8Array.from(Buffer.from(stakingInput.finalityProviderPkNoCoordHex, "hex")),
                ],
                stakingTime: stakingInput.stakingTimelock,
                stakingValue: stakingInput.stakingAmountSat,
                stakingTx: Uint8Array.from(stakingTx.toBuffer()),
                slashingTx: Uint8Array.from(Buffer.from(clearTxSignatures(signedSlashingTx).toHex(), "hex")),
                delegatorSlashingSig: Uint8Array.from(slashingSig),
                unbondingTime: params.unbondingTime,
                unbondingTx: Uint8Array.from(unbondingTx.toBuffer()),
                unbondingValue: stakingInput.stakingAmountSat - params.unbondingFeeSat,
                unbondingSlashingTx: Uint8Array.from(Buffer.from(clearTxSignatures(signedUnbondingSlashingTx).toHex(), "hex")),
                delegatorUnbondingSlashingSig: Uint8Array.from(unbondingSignatures),
                stakingTxInclusionProof: inclusionProof,
            });
            return {
                typeUrl: registry_1.BABYLON_REGISTRY_TYPE_URLS.MsgCreateBTCDelegation,
                value: msg,
            };
        });
    }
    ;
    /**
     * Gets the inclusion proof for the staking transaction.
     * See the type `InclusionProof` for more information
     * @param inclusionProof - The inclusion proof.
     * @returns The inclusion proof.
     */
    getInclusionProof(inclusionProof) {
        const { pos, merkle, blockHashHex } = inclusionProof;
        const proofHex = deriveMerkleProof(merkle);
        const hash = (0, utils_1.reverseBuffer)(Uint8Array.from(Buffer.from(blockHashHex, "hex")));
        const inclusionProofKey = babylon_proto_ts_1.btccheckpoint.TransactionKey.fromPartial({
            index: pos,
            hash,
        });
        return babylon_proto_ts_1.btcstaking.InclusionProof.fromPartial({
            key: inclusionProofKey,
            proof: Uint8Array.from(Buffer.from(proofHex, "hex")),
        });
    }
    ;
}
exports.BabylonBtcStakingManager = BabylonBtcStakingManager;
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
const extractFirstSchnorrSignatureFromTransaction = (singedTransaction) => {
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
const clearTxSignatures = (tx) => {
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
const deriveMerkleProof = (merkle) => {
    const proofHex = merkle.reduce((acc, m) => {
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
const getUnbondingTxStakerSignature = (unbondingTx) => {
    try {
        // There is only one input and one output in the unbonding transaction
        return unbondingTx.ins[0].witness[0].toString("hex");
    }
    catch (error) {
        throw error_1.StakingError.fromUnknown(error, error_2.StakingErrorCode.INVALID_INPUT, "Failed to get staker signature");
    }
};
exports.getUnbondingTxStakerSignature = getUnbondingTxStakerSignature;
