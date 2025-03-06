import { opcodes, script } from "bitcoinjs-lib";
import { NO_COORD_PK_BYTE_LENGTH } from "../constants/keys";

export const MAGIC_BYTES_LEN = 4;

// Represents the staking scripts used in BTC staking.
export interface StakingScripts {
  timelockScript: Buffer;
  unbondingScript: Buffer;
  slashingScript: Buffer;
  unbondingTimelockScript: Buffer;
}

// StakingScriptData is a class that holds the data required for the BTC Staking Script
// and exposes methods for converting it into useful formats
export class StakingScriptData {
  stakerKey: Buffer;
  finalityProviderKeys: Buffer[];
  covenantKeys: Buffer[];
  covenantThreshold: number;
  stakingTimeLock: number;
  unbondingTimeLock: number;

  constructor(
    // The `stakerKey` is the public key of the staker without the coordinate bytes.
    stakerKey: Buffer,
    // A list of public keys without the coordinate bytes corresponding to the finality providers
    // the stake will be delegated to.
    // Currently, Babylon does not support restaking, so this should contain only a single item.
    finalityProviderKeys: Buffer[],
    // A list of the public keys without the coordinate bytes corresponding to
    // the covenant emulators.
    // This is a parameter of the Babylon system and should be retrieved from there.
    covenantKeys: Buffer[],
    // The number of covenant emulator signatures required for a transaction
    // to be valid.
    // This is a parameter of the Babylon system and should be retrieved from there.
    covenantThreshold: number,
    // The staking period denoted as a number of BTC blocks.
    stakingTimelock: number,
    // The unbonding period denoted as a number of BTC blocks.
    // This value should be more than equal than the minimum unbonding time of the
    // Babylon system.
    unbondingTimelock: number,
  ) {
    if (
      !stakerKey ||
      !finalityProviderKeys ||
      !covenantKeys ||
      !covenantThreshold ||
      !stakingTimelock ||
      !unbondingTimelock
    ) {
      throw new Error("Missing required input values");
    }
    this.stakerKey = stakerKey;
    this.finalityProviderKeys = finalityProviderKeys;
    this.covenantKeys = covenantKeys;
    this.covenantThreshold = covenantThreshold;
    this.stakingTimeLock = stakingTimelock;
    this.unbondingTimeLock = unbondingTimelock;

    // Run the validate method to check if the provided script data is valid
    if (!this.validate()) {
      throw new Error("Invalid script data provided");
    }
  }

  /**
   * Validates the staking script.
   * @returns {boolean} Returns true if the staking script is valid, otherwise false.
   */
  validate(): boolean {
    // check that staker key is the correct length
    if (this.stakerKey.length != NO_COORD_PK_BYTE_LENGTH) {
      return false;
    }
    // check that finalityProvider keys are the correct length
    if (
      this.finalityProviderKeys.some(
        (finalityProviderKey) => finalityProviderKey.length != NO_COORD_PK_BYTE_LENGTH,
      )
    ) {
      return false;
    }
    // check that covenant keys are the correct length
    if (
      this.covenantKeys.some((covenantKey) => covenantKey.length != NO_COORD_PK_BYTE_LENGTH)
    ) {
      return false;
    }

    // Check whether we have any duplicate keys
    const allPks = [
      this.stakerKey,
      ...this.finalityProviderKeys,
      ...this.covenantKeys,
    ];
    const allPksSet = new Set(allPks);
    if (allPks.length !== allPksSet.size) {
      return false;
    }

    // check that the threshold is above 0 and less than or equal to
    // the size of the covenant emulators set
    if (
      this.covenantThreshold == 0 ||
      this.covenantThreshold > this.covenantKeys.length
    ) {
      return false;
    }

    // check that maximum value for staking time is not greater than uint16 and above 0
    if (this.stakingTimeLock == 0 || this.stakingTimeLock > 65535) {
      return false;
    }

    // check that maximum value for unbonding time is not greater than uint16 and above 0
    if (this.unbondingTimeLock == 0 || this.unbondingTimeLock > 65535) {
      return false;
    }

    return true;
  }

  // The staking script allows for multiple finality provider public keys
  // to support (re)stake to multiple finality providers
  // Covenant members are going to have multiple keys

  /**
   * Builds a timelock script.
   * @param timelock - The timelock value to encode in the script.
   * @returns {Buffer} containing the compiled timelock script.
   */
  buildTimelockScript(timelock: number): Buffer {
    return script.compile([
      this.stakerKey,
      opcodes.OP_CHECKSIGVERIFY,
      script.number.encode(timelock),
      opcodes.OP_CHECKSEQUENCEVERIFY,
    ]);
  }

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
  buildStakingTimelockScript(): Buffer {
    return this.buildTimelockScript(this.stakingTimeLock);
  }

  /**
   * Builds the unbonding timelock script.
   * Creates the unbonding timelock script in the form:
   *    <stakerPubKey>
   *    OP_CHECKSIGVERIFY
   *    <unbondingTimeBlocks>
   *    OP_CHECKSEQUENCEVERIFY
   * @returns {Buffer} The unbonding timelock script.
   */
  buildUnbondingTimelockScript(): Buffer {
    return this.buildTimelockScript(this.unbondingTimeLock);
  }

  /**
   * Builds the unbonding script in the form:
   *    buildSingleKeyScript(stakerPk, true) ||
   *    buildMultiKeyScript(covenantPks, covenantThreshold, false)
   *    || means combining the scripts
   * @returns {Buffer} The unbonding script.
   */
  buildUnbondingScript(): Buffer {
    return Buffer.concat([
      this.buildSingleKeyScript(this.stakerKey, true),
      this.buildMultiKeyScript(
        this.covenantKeys,
        this.covenantThreshold,
        false,
      ),
    ]);
  }

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
  buildSlashingScript(): Buffer {
    return Buffer.concat([
      this.buildSingleKeyScript(this.stakerKey, true),
      this.buildMultiKeyScript(
        this.finalityProviderKeys,
        // The threshold is always 1 as we only need one
        // finalityProvider signature to perform slashing
        // (only one finalityProvider performs an offence)
        1,
        // OP_VERIFY/OP_CHECKSIGVERIFY is added at the end
        true,
      ),
      this.buildMultiKeyScript(
        this.covenantKeys,
        this.covenantThreshold,
        // No need to add verify since covenants are at the end of the script
        false,
      ),
    ]);
  }
  /**
   * Builds the staking scripts.
   * @returns {StakingScripts} The staking scripts.
   */
  buildScripts(): StakingScripts {
    return {
      timelockScript: this.buildStakingTimelockScript(),
      unbondingScript: this.buildUnbondingScript(),
      slashingScript: this.buildSlashingScript(),
      unbondingTimelockScript: this.buildUnbondingTimelockScript(),
    };
  }

  // buildSingleKeyScript and buildMultiKeyScript allow us to reuse functionality
  // for creating Bitcoin scripts for the unbonding script and the slashing script

  /**
   * Builds a single key script in the form:
   * buildSingleKeyScript creates a single key script
   *    <pk> OP_CHECKSIGVERIFY (if withVerify is true)
   *    <pk> OP_CHECKSIG (if withVerify is false)
   * @param pk - The public key buffer.
   * @param withVerify - A boolean indicating whether to include the OP_CHECKSIGVERIFY opcode.
   * @returns The compiled script buffer.
   */
  buildSingleKeyScript(pk: Buffer, withVerify: boolean): Buffer {
    // Check public key length
    if (pk.length != NO_COORD_PK_BYTE_LENGTH) {
      throw new Error("Invalid key length");
    }
    return script.compile([
      pk,
      withVerify ? opcodes.OP_CHECKSIGVERIFY : opcodes.OP_CHECKSIG,
    ]);
  }

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
  buildMultiKeyScript(
    pks: Buffer[],
    threshold: number,
    withVerify: boolean,
  ): Buffer {
    // Verify that pks is not empty
    if (!pks || pks.length === 0) {
      throw new Error("No keys provided");
    }
    // Check buffer object have expected lengths like checking pks.length
    if (pks.some((pk) => pk.length != NO_COORD_PK_BYTE_LENGTH)) {
      throw new Error("Invalid key length");
    }
    // Verify that threshold <= len(pks)
    if (threshold > pks.length) {
      throw new Error(
        "Required number of valid signers is greater than number of provided keys",
      );
    }
    if (pks.length === 1) {
      return this.buildSingleKeyScript(pks[0], withVerify);
    }
    // keys must be sorted
    const sortedPks = [...pks].sort(Buffer.compare);
    // verify there are no duplicates
    for (let i = 0; i < sortedPks.length - 1; ++i) {
      if (sortedPks[i].equals(sortedPks[i + 1])) {
        throw new Error("Duplicate keys provided");
      }
    }
    const scriptElements = [sortedPks[0], opcodes.OP_CHECKSIG];
    for (let i = 1; i < sortedPks.length; i++) {
      scriptElements.push(sortedPks[i]);
      scriptElements.push(opcodes.OP_CHECKSIGADD);
    }
    scriptElements.push(script.number.encode(threshold));
    if (withVerify) {
      scriptElements.push(opcodes.OP_NUMEQUALVERIFY);
    } else {
      scriptElements.push(opcodes.OP_NUMEQUAL);
    }
    return script.compile(scriptElements);
  }
}
