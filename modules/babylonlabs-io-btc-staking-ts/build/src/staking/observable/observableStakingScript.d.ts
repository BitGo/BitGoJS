import { StakingScriptData, StakingScripts } from "../stakingScript";
export interface ObservableStakingScripts extends StakingScripts {
    dataEmbedScript: Buffer;
}
export declare class ObservableStakingScriptData extends StakingScriptData {
    magicBytes: Buffer;
    constructor(stakerKey: Buffer, finalityProviderKeys: Buffer[], covenantKeys: Buffer[], covenantThreshold: number, stakingTimelock: number, unbondingTimelock: number, magicBytes: Buffer);
    /**
     * Builds a data embed script for staking in the form:
     *    OP_RETURN || <serializedStakingData>
     * where serializedStakingData is the concatenation of:
     *    MagicBytes || Version || StakerPublicKey || FinalityProviderPublicKey || StakingTimeLock
     * Note: Only a single finality provider key is supported for now in phase 1
     * @throws {Error} If the number of finality provider keys is not equal to 1.
     * @returns {Buffer} The compiled data embed script.
     */
    buildDataEmbedScript(): Buffer;
    /**
     * Builds the staking scripts.
     * @returns {ObservableStakingScripts} The staking scripts that can be used to stake.
     * contains the timelockScript, unbondingScript, slashingScript,
     * unbondingTimelockScript, and dataEmbedScript.
     * @throws {Error} If script data is invalid.
     */
    buildScripts(): ObservableStakingScripts;
}
