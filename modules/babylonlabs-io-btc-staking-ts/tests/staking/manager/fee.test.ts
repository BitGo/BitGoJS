import { networks } from "bitcoinjs-lib";

import { BabylonBtcStakingManager } from "../../../src/staking/manager";

import {
  btcTipHeight,
  feeRate,
  invalidStartHeightArr,
  stakerInfo,
  stakerInfoArr,
  stakingInput,
  stakingParams,
  utxos,
} from "./__mock__/fee";
import { babylonProvider, btcProvider } from "./__mock__/providers";

describe("Staking Manager", () => {
  describe("estimateBtcStakingFee", () => {
    let manager: BabylonBtcStakingManager;

    beforeEach(() => {
      manager = new BabylonBtcStakingManager(
        networks.testnet,
        stakingParams,
        btcProvider,
        babylonProvider,
      );
    });

    afterEach(() => {
      btcProvider.signPsbt.mockReset();
    });

    it.each(invalidStartHeightArr)(
      "should validate babylonBtcTipHeight",
      async (btcTipHeight, errorMessage) => {
        try {
          await manager.estimateBtcStakingFee(
            stakerInfo,
            btcTipHeight,
            stakingInput,
            utxos,
            feeRate,
          );
        } catch (e: any) {
          expect(e.message).toMatch(errorMessage);
        }
      },
    );

    it("should validate babylonBtcTipHeight", async () => {
      const btcTipHeight = 100;

      try {
        await manager.estimateBtcStakingFee(
          stakerInfo,
          btcTipHeight,
          stakingInput,
          utxos,
          feeRate,
        );
      } catch (e: any) {
        expect(e.message).toMatch(
          `Babylon params not found for height ${btcTipHeight}`,
        );
      }
    });

    it.each(stakerInfoArr)("should return valid tx fee", async (stakerInfo) => {
      const txFee = await manager.estimateBtcStakingFee(
        stakerInfo,
        btcTipHeight,
        stakingInput,
        utxos,
        feeRate,
      );

      expect(txFee).toEqual(620);
    });
  });
});
