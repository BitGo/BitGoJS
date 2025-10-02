"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservableStakingScriptData = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const stakingScript_1 = require("../stakingScript");
class ObservableStakingScriptData extends stakingScript_1.StakingScriptData {
    constructor(stakerKey, finalityProviderKeys, covenantKeys, covenantThreshold, stakingTimelock, unbondingTimelock, magicBytes) {
        super(stakerKey, finalityProviderKeys, covenantKeys, covenantThreshold, stakingTimelock, unbondingTimelock);
        if (!magicBytes) {
            throw new Error("Missing required input values");
        }
        // check that the magic bytes are 4 in length
        if (magicBytes.length != stakingScript_1.MAGIC_BYTES_LEN) {
            throw new Error("Invalid script data provided");
        }
        this.magicBytes = magicBytes;
    }
    /**
     * Builds a data embed script for staking in the form:
     *    OP_RETURN || <serializedStakingData>
     * where serializedStakingData is the concatenation of:
     *    MagicBytes || Version || StakerPublicKey || FinalityProviderPublicKey || StakingTimeLock
     * Note: Only a single finality provider key is supported for now in phase 1
     * @throws {Error} If the number of finality provider keys is not equal to 1.
     * @returns {Buffer} The compiled data embed script.
     */
    buildDataEmbedScript() {
        // Only accept a single finality provider key for now
        if (this.finalityProviderKeys.length != 1) {
            throw new Error("Only a single finality provider key is supported");
        }
        // 1 byte for version
        const version = Buffer.alloc(1);
        version.writeUInt8(0);
        // 2 bytes for staking time
        const stakingTimeLock = Buffer.alloc(2);
        // big endian
        stakingTimeLock.writeUInt16BE(this.stakingTimeLock);
        const serializedStakingData = Buffer.concat([
            this.magicBytes,
            version,
            this.stakerKey,
            this.finalityProviderKeys[0],
            stakingTimeLock,
        ]);
        return bitcoinjs_lib_1.script.compile([bitcoinjs_lib_1.opcodes.OP_RETURN, serializedStakingData]);
    }
    /**
     * Builds the staking scripts.
     * @returns {ObservableStakingScripts} The staking scripts that can be used to stake.
     * contains the timelockScript, unbondingScript, slashingScript,
     * unbondingTimelockScript, and dataEmbedScript.
     * @throws {Error} If script data is invalid.
     */
    buildScripts() {
        const scripts = super.buildScripts();
        return Object.assign(Object.assign({}, scripts), { dataEmbedScript: this.buildDataEmbedScript() });
    }
}
exports.ObservableStakingScriptData = ObservableStakingScriptData;
