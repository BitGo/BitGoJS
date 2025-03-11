export declare const MAGIC_BYTES_LEN = 4;
export interface StakingScripts {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
    unbondingTimelockScript: Buffer;
}
export declare class StakingScriptData {
    stakerKey: Buffer;
    finalityProviderKeys: Buffer[];
    covenantKeys: Buffer[];
    covenantThreshold: number;
    stakingTimeLock: number;
    unbondingTimeLock: number;
    constructor(stakerKey: Buffer, finalityProviderKeys: Buffer[], covenantKeys: Buffer[], covenantThreshold: number, stakingTimelock: number, unbondingTimelock: number);
    /**
     * Validates the staking script.
     * @returns {boolean} Returns true if the staking script is valid, otherwise false.
     */
    validate(): boolean;
    /**
     * Builds a timelock script.
     * @param timelock - The timelock value to encode in the script.
     * @returns {Buffer} containing the compiled timelock script.
     */
    buildTimelockScript(timelock: number): Buffer;
    /**
     * Builds the staking timelock script.
     * Only holder of private key for given pubKey can spend after relative lock time
     * Creates the timelock script in the form:
     *    <stakerPubKey>
     *    OP_CHECKSIGVERIFY
     *    <stakingTimeBlocks>
     *    OP_CHECKSEQUENCEVERIFY
     * @returns {Buffer} The staking timelock script.
     */
    buildStakingTimelockScript(): Buffer;
    /**
     * Builds the unbonding timelock script.
     * Creates the unbonding timelock script in the form:
     *    <stakerPubKey>
     *    OP_CHECKSIGVERIFY
     *    <unbondingTimeBlocks>
     *    OP_CHECKSEQUENCEVERIFY
     * @returns {Buffer} The unbonding timelock script.
     */
    buildUnbondingTimelockScript(): Buffer;
    /**
     * Builds the unbonding script in the form:
     *    buildSingleKeyScript(stakerPk, true) ||
     *    buildMultiKeyScript(covenantPks, covenantThreshold, false)
     *    || means combining the scripts
     * @returns {Buffer} The unbonding script.
     */
    buildUnbondingScript(): Buffer;
    /**
     * Builds the slashing script for staking in the form:
     *    buildSingleKeyScript(stakerPk, true) ||
     *    buildMultiKeyScript(finalityProviderPKs, 1, true) ||
     *    buildMultiKeyScript(covenantPks, covenantThreshold, false)
     *    || means combining the scripts
     * The slashing script is a combination of single-key and multi-key scripts.
     * The single-key script is used for staker key verification.
     * The multi-key script is used for finality provider key verification and covenant key verification.
     * @returns {Buffer} The slashing script as a Buffer.
     */
    buildSlashingScript(): Buffer;
    /**
     * Builds the staking scripts.
     * @returns {StakingScripts} The staking scripts.
     */
    buildScripts(): StakingScripts;
    /**
     * Builds a single key script in the form:
     * buildSingleKeyScript creates a single key script
     *    <pk> OP_CHECKSIGVERIFY (if withVerify is true)
     *    <pk> OP_CHECKSIG (if withVerify is false)
     * @param pk - The public key buffer.
     * @param withVerify - A boolean indicating whether to include the OP_CHECKSIGVERIFY opcode.
     * @returns The compiled script buffer.
     */
    buildSingleKeyScript(pk: Buffer, withVerify: boolean): Buffer;
    /**
     * Builds a multi-key script in the form:
     *    <pk1> OP_CHEKCSIG <pk2> OP_CHECKSIGADD <pk3> OP_CHECKSIGADD ... <pkN> OP_CHECKSIGADD <threshold> OP_NUMEQUAL
     *    <withVerify -> OP_NUMEQUALVERIFY>
     * It validates whether provided keys are unique and the threshold is not greater than number of keys
     * If there is only one key provided it will return single key sig script
     * @param pks - An array of public keys.
     * @param threshold - The required number of valid signers.
     * @param withVerify - A boolean indicating whether to include the OP_VERIFY opcode.
     * @returns The compiled multi-key script as a Buffer.
     * @throws {Error} If no keys are provided, if the required number of valid signers is greater than the number of provided keys, or if duplicate keys are provided.
     */
    buildMultiKeyScript(pks: Buffer[], threshold: number, withVerify: boolean): Buffer;
}
