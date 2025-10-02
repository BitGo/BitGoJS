import { networks, Transaction } from "bitcoinjs-lib";
import { TransactionOutput } from "../../types/psbtOutputs";
import { UTXO } from "../../types/UTXO";
import { StakingParams } from "../../types/params";
export interface OutputInfo {
    scriptPubKey: Buffer;
    outputAddress: string;
}
/**
 * Build the staking output for the transaction which contains p2tr output
 * with staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} amount - The amount to stake.
 * @returns {TransactionOutput[]} - The staking transaction outputs.
 * @throws {Error} - If the staking output cannot be built.
 */
export declare const buildStakingTransactionOutputs: (scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
    dataEmbedScript?: Buffer;
}, network: networks.Network, amount: number) => TransactionOutput[];
/**
 * Derive the staking output address from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {StakingOutput} - The staking output address and scriptPubKey.
 * @throws {StakingError} - If the staking output address cannot be derived.
 */
export declare const deriveStakingOutputInfo: (scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
}, network: networks.Network) => {
    outputAddress: string;
    scriptPubKey: Buffer<ArrayBufferLike>;
};
/**
 * Derive the unbonding output address and scriptPubKey from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The unbonding output address and scriptPubKey.
 * @throws {StakingError} - If the unbonding output address cannot be derived.
 */
export declare const deriveUnbondingOutputInfo: (scripts: {
    unbondingTimelockScript: Buffer;
    slashingScript: Buffer;
}, network: networks.Network) => {
    outputAddress: string;
    scriptPubKey: Buffer<ArrayBufferLike>;
};
/**
 * Derive the slashing output address and scriptPubKey from the staking scripts.
 *
 * @param {StakingScripts} scripts - The unbonding timelock scripts, we use the
 * unbonding timelock script as the timelock of the slashing transaction.
 * This is due to slashing tx timelock is the same as the unbonding timelock.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The slashing output address and scriptPubKey.
 * @throws {StakingError} - If the slashing output address cannot be derived.
 */
export declare const deriveSlashingOutput: (scripts: {
    unbondingTimelockScript: Buffer;
}, network: networks.Network) => {
    outputAddress: string;
    scriptPubKey: Buffer<ArrayBufferLike>;
};
/**
 * Find the matching output index for the given transaction.
 *
 * @param {Transaction} tx - The transaction.
 * @param {string} outputAddress - The output address.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {number} - The output index.
 * @throws {Error} - If the matching output is not found.
 */
export declare const findMatchingTxOutputIndex: (tx: Transaction, outputAddress: string, network: networks.Network) => number;
/**
 * Validate the staking transaction input data.
 *
 * @param {number} stakingAmountSat - The staking amount in satoshis.
 * @param {number} timelock - The staking time in blocks.
 * @param {StakingParams} params - The staking parameters.
 * @param {UTXO[]} inputUTXOs - The input UTXOs.
 * @param {number} feeRate - The Bitcoin fee rate in sat/vbyte
 * @throws {StakingError} - If the input data is invalid.
 */
export declare const validateStakingTxInputData: (stakingAmountSat: number, timelock: number, params: StakingParams, inputUTXOs: UTXO[], feeRate: number) => void;
/**
 * Validate the staking parameters.
 * Extend this method to add additional validation for staking parameters based
 * on the staking type.
 * @param {StakingParams} params - The staking parameters.
 * @throws {StakingError} - If the parameters are invalid.
 */
export declare const validateParams: (params: StakingParams) => void;
/**
 * Validate the staking timelock.
 *
 * @param {number} stakingTimelock - The staking timelock.
 * @param {StakingParams} params - The staking parameters.
 * @throws {StakingError} - If the staking timelock is invalid.
 */
export declare const validateStakingTimelock: (stakingTimelock: number, params: StakingParams) => void;
/**
 * toBuffers converts an array of strings to an array of buffers.
 *
 * @param {string[]} inputs - The input strings.
 * @returns {Buffer[]} - The buffers.
 * @throws {StakingError} - If the values cannot be converted to buffers.
 */
export declare const toBuffers: (inputs: string[]) => Buffer[];
