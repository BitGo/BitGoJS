"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbondingPsbt = exports.stakingPsbt = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const internalPubkey_1 = require("../constants/internalPubkey");
const keys_1 = require("../constants/keys");
const transaction_1 = require("../constants/transaction");
const staking_1 = require("../utils/staking");
const findInputUTXO_1 = require("../utils/utxo/findInputUTXO");
const getPsbtInputFields_1 = require("../utils/utxo/getPsbtInputFields");
/**
 * Convert a staking transaction to a PSBT.
 *
 * @param {Transaction} stakingTx - The staking transaction to convert to PSBT.
 * @param {networks.Network} network - The network to use for the PSBT.
 * @param {UTXO[]} inputUTXOs - The UTXOs to be used as inputs for the staking
 * transaction.
 * @param {Buffer} [publicKeyNoCoord] - The public key of staker (optional)
 * @returns {Psbt} - The PSBT for the staking transaction.
 * @throws {Error} If unable to create PSBT from transaction
 */
const stakingPsbt = (stakingTx, network, inputUTXOs, publicKeyNoCoord) => {
    if (publicKeyNoCoord && publicKeyNoCoord.length !== keys_1.NO_COORD_PK_BYTE_LENGTH) {
        throw new Error("Invalid public key");
    }
    const psbt = new bitcoinjs_lib_1.Psbt({ network });
    if (stakingTx.version !== undefined)
        psbt.setVersion(stakingTx.version);
    if (stakingTx.locktime !== undefined)
        psbt.setLocktime(stakingTx.locktime);
    stakingTx.ins.forEach((input) => {
        const inputUTXO = (0, findInputUTXO_1.findInputUTXO)(inputUTXOs, input);
        const psbtInputData = (0, getPsbtInputFields_1.getPsbtInputFields)(inputUTXO, publicKeyNoCoord);
        psbt.addInput(Object.assign({ hash: input.hash, index: input.index, sequence: input.sequence }, psbtInputData));
    });
    stakingTx.outs.forEach((o) => {
        psbt.addOutput({ script: o.script, value: o.value });
    });
    return psbt;
};
exports.stakingPsbt = stakingPsbt;
const unbondingPsbt = (scripts, unbondingTx, stakingTx, network) => {
    if (unbondingTx.outs.length !== 1) {
        throw new Error("Unbonding transaction must have exactly one output");
    }
    if (unbondingTx.ins.length !== 1) {
        throw new Error("Unbonding transaction must have exactly one input");
    }
    validateUnbondingOutput(scripts, unbondingTx, network);
    const psbt = new bitcoinjs_lib_1.Psbt({ network });
    if (unbondingTx.version !== undefined) {
        psbt.setVersion(unbondingTx.version);
    }
    if (unbondingTx.locktime !== undefined) {
        psbt.setLocktime(unbondingTx.locktime);
    }
    const input = unbondingTx.ins[0];
    const outputIndex = input.index;
    // Build input tapleaf script
    const inputScriptTree = [
        { output: scripts.slashingScript },
        [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
    ];
    // This is the tapleaf we are actually spending
    const inputRedeem = {
        output: scripts.unbondingScript,
        redeemVersion: transaction_1.REDEEM_VERSION,
    };
    // Create a P2TR payment that includes scriptTree + redeem
    const p2tr = bitcoinjs_lib_1.payments.p2tr({
        internalPubkey: internalPubkey_1.internalPubkey,
        scriptTree: inputScriptTree,
        redeem: inputRedeem,
        network,
    });
    const inputTapLeafScript = {
        leafVersion: inputRedeem.redeemVersion,
        script: inputRedeem.output,
        controlBlock: p2tr.witness[p2tr.witness.length - 1],
    };
    psbt.addInput({
        hash: input.hash,
        index: input.index,
        sequence: input.sequence,
        tapInternalKey: internalPubkey_1.internalPubkey,
        witnessUtxo: {
            value: stakingTx.outs[outputIndex].value,
            script: stakingTx.outs[outputIndex].script,
        },
        tapLeafScript: [inputTapLeafScript],
    });
    psbt.addOutput({
        script: unbondingTx.outs[0].script,
        value: unbondingTx.outs[0].value,
    });
    return psbt;
};
exports.unbondingPsbt = unbondingPsbt;
/**
 * Validate the unbonding output for a given unbonding transaction.
 *
 * @param {Object} scripts - The scripts to use for the unbonding output.
 * @param {Transaction} unbondingTx - The unbonding transaction.
 * @param {networks.Network} network - The network to use for the unbonding output.
 */
const validateUnbondingOutput = (scripts, unbondingTx, network) => {
    const unbondingOutputInfo = (0, staking_1.deriveUnbondingOutputInfo)(scripts, network);
    if (unbondingOutputInfo.scriptPubKey.toString("hex") !==
        unbondingTx.outs[0].script.toString("hex")) {
        throw new Error("Unbonding output script does not match the expected" +
            " script while building psbt");
    }
};
