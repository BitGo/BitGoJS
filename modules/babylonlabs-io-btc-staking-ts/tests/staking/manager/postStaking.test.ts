import { networks, Transaction } from "bitcoinjs-lib";

import { BabylonBtcStakingManager } from "../../../src/staking/manager";

import { btcstakingtx } from "@babylonlabs-io/babylon-proto-ts";
import { ContractId } from "../../../src/types/contract";
import { babylonProvider, btcProvider } from "./__mock__/providers";
import {
  babylonAddress,
  btcTipHeight,
  inclusionProof,
  invalidBabylonAddresses,
  invalidStartHeightArr,
  params,
  stakerInfo,
  stakerInfoArr,
  stakingInput,
  stakingTx,
} from "./__mock__/registration";
import { ActionName } from "../../../src/types/action";

describe("Staking Manager", () => {
  describe("postStakeRegistrationBabylonTransaction", () => {
    let manager: BabylonBtcStakingManager;

    beforeEach(() => {
      manager = new BabylonBtcStakingManager(
        networks.testnet,
        params,
        btcProvider,
        babylonProvider,
      );
    });

    afterEach(() => {
      btcProvider.signPsbt.mockReset();
      btcProvider.signMessage.mockReset();
      babylonProvider.signTransaction.mockReset();
    });

    it.each(invalidStartHeightArr)(
      "should validate babylonBtcTipHeight %s",
      async (btcTipHeight) => {
        try {
          await manager.postStakeRegistrationBabylonTransaction(
            stakerInfo,
            stakingTx,
            btcTipHeight,
            stakingInput,
            inclusionProof,
            babylonAddress,
          );
        } catch (e: any) {
          expect(e.message).toMatch(
            `Babylon params not found for height ${btcTipHeight}`,
          );
        }
      },
    );

    it.each(invalidBabylonAddresses)(
      "should validate babylon address",
      async (babylonAddress) => {
        try {
          await manager.postStakeRegistrationBabylonTransaction(
            stakerInfo,
            stakingTx,
            btcTipHeight,
            stakingInput,
            inclusionProof,
            babylonAddress,
          );
        } catch (e: any) {
          expect(e.message).toMatch("Invalid Babylon address");
        }
      },
    );

    it("should validate tx output", async () => {
      const tx = {
        ...stakingTx,
        outs: [],
      } as any;

      try {
        await manager.postStakeRegistrationBabylonTransaction(
          stakerInfo,
          tx,
          btcTipHeight,
          stakingInput,
          inclusionProof,
          babylonAddress,
        );
      } catch (e: any) {
        expect(e.message).toMatch(/Matching output not found for address:/);
      }
    });

    it.each(stakerInfoArr)(
      "should create valid pre stake registration tx",
      async (
        stakerInfo,
        {
          slashingPsbt,
          unbondingSlashingPsbt,
          signedSlashingPsbt,
          signedUnbondingSlashingPsbt,
          signedBabylonAddress,
          stakingTxHex,
          postStakingDelegationMsg,
          signType,
        },
      ) => {
        const version = 4;

        btcProvider.signPsbt
          .mockResolvedValueOnce(signedSlashingPsbt)
          .mockResolvedValueOnce(signedUnbondingSlashingPsbt);
        btcProvider.signMessage.mockResolvedValueOnce(signedBabylonAddress);

        await manager.postStakeRegistrationBabylonTransaction(
          stakerInfo,
          Transaction.fromHex(stakingTxHex),
          btcTipHeight,
          stakingInput,
          inclusionProof,
          babylonAddress,
        );

        expect(btcProvider.signPsbt).toHaveBeenCalledWith(slashingPsbt, {
          contracts: [
            {
              id: ContractId.STAKING,
              params: {
                stakerPk: stakerInfo.publicKeyNoCoordHex,
                finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
                covenantPks: params[version].covenantNoCoordPks,
                covenantThreshold: params[version].covenantQuorum,
                minUnbondingTime: params[version].unbondingTime,
                stakingDuration: stakingInput.stakingTimelock,
              },
            },
            {
              id: ContractId.SLASHING,
              params: {
                stakerPk: stakerInfo.publicKeyNoCoordHex,
                unbondingTimeBlocks: params[version].unbondingTime,
                slashingFeeSat: params[version].slashing?.minSlashingTxFeeSat,
              },
            },
            {
              id: ContractId.SLASHING_BURN,
              params: {
                stakerPk: stakerInfo.publicKeyNoCoordHex,
                slashingPkScriptHex: params[version].slashing?.slashingPkScriptHex,
              },
            },
          ],
          action: {
            name: ActionName.SIGN_BTC_SLASHING_TRANSACTION,
          },
        });
        expect(btcProvider.signPsbt).toHaveBeenCalledWith(
          unbondingSlashingPsbt,
          {
            contracts: [
              {
                id: ContractId.UNBONDING,
                params: {
                  stakerPk: stakerInfo.publicKeyNoCoordHex,
                  finalityProviders: stakingInput.finalityProviderPksNoCoordHex,
                  covenantPks: params[version].covenantNoCoordPks,
                  covenantThreshold: params[version].covenantQuorum,
                  unbondingTimeBlocks: params[version].unbondingTime,
                  unbondingFeeSat: params[version].unbondingFeeSat,
                },
              },
              {
                id: ContractId.SLASHING,
                params: {
                  stakerPk: stakerInfo.publicKeyNoCoordHex,
                  unbondingTimeBlocks: params[version].unbondingTime,
                  slashingFeeSat: params[version].slashing?.minSlashingTxFeeSat,
                },
              },
              {
                id: ContractId.SLASHING_BURN,
                params: {
                  stakerPk: stakerInfo.publicKeyNoCoordHex,
                  slashingPkScriptHex: params[version].slashing?.slashingPkScriptHex,
                },
              },
            ],
            action: {
              name: ActionName.SIGN_BTC_UNBONDING_SLASHING_TRANSACTION,
            },
          },
        );
        expect(btcProvider.signMessage).toHaveBeenCalledWith(
          babylonAddress,
          signType,
        );
        expect(
          btcstakingtx.MsgCreateBTCDelegation.toJSON(
            babylonProvider.signTransaction.mock.calls[0][0].value,
          ),
        ).toEqual(postStakingDelegationMsg);
      },
    );
  });
});
