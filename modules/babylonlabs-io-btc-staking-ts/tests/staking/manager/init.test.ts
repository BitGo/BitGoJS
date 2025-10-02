import { networks } from "bitcoinjs-lib";

import { BabylonBtcStakingManager } from "../../../src/staking/manager";

import { babylonProvider, btcProvider } from "./__mock__/providers";
import { params } from "./__mock__/staking";

describe("Staking Manager", () => {
  describe("Initialization", () => {
    it("should succesfully initialize Staking Manager", () => {
      const manager = new BabylonBtcStakingManager(
        networks.bitcoin,
        params,
        btcProvider,
        babylonProvider,
      );

      expect(manager).toBeDefined();
    });

    it("should throw an init error", () => {
      expect(
        () =>
          new BabylonBtcStakingManager(
            networks.bitcoin,
            [],
            btcProvider,
            babylonProvider,
          ),
      ).toThrow("No staking parameters provided");
    });
  });
});
