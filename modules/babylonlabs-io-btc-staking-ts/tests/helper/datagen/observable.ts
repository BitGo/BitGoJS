import { ObservableStakingScriptData, ObservableStakingScripts } from "../../../src/staking/observable";
import { ObservableVersionedStakingParams } from "../../../src/types/params";
import { StakingDataGenerator } from "./base";

export class ObservableStakingDatagen extends StakingDataGenerator {
   generateRandomTag = () => {
    const buffer = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  };

  generateStakingParams = (
    fixedTerm = false,
    committeeSize?: number,
    minStakingAmount?: number,
  ): ObservableVersionedStakingParams => {
    return {
      ...super.generateStakingParams(fixedTerm, committeeSize, minStakingAmount),
      btcActivationHeight: this.getRandomIntegerBetween(1000, 100000),
      tag: this.generateRandomTag().toString("hex"),
      version: this.getRandomIntegerBetween(1, 10),
    };
  };

  generateStakingScriptData = (
    stakerPkNoCoord: string,
    params: ObservableVersionedStakingParams,
    timelock: number,
  ): ObservableStakingScripts => {
    const fpPkHex = this.generateRandomKeyPair().publicKeyNoCoord;
    return new ObservableStakingScriptData(
      Buffer.from(stakerPkNoCoord, "hex"),
      [Buffer.from(fpPkHex, "hex")],
      params.covenantNoCoordPks.map((pk: string) => Buffer.from(pk, "hex")),
      params.covenantQuorum,
      timelock,
      params.unbondingTime,
      Buffer.from(params.tag, "hex"),
    ).buildScripts();
  }
}