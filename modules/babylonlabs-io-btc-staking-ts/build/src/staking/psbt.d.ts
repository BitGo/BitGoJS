import { Psbt, Transaction, networks } from "bitcoinjs-lib";
import { UTXO } from "../types/UTXO";
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
export declare const stakingPsbt: (stakingTx: Transaction, network: networks.Network, inputUTXOs: UTXO[], publicKeyNoCoord?: Buffer) => Psbt;
export declare const unbondingPsbt: (scripts: {
    unbondingScript: Buffer;
    timelockScript: Buffer;
    slashingScript: Buffer;
    unbondingTimelockScript: Buffer;
}, unbondingTx: Transaction, stakingTx: Transaction, network: networks.Network) => Psbt;
