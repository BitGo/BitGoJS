import { networks, Psbt } from "bitcoinjs-lib";

import { BabylonBtcStakingManager } from "../../../src/staking/manager";

import { babylonProvider, btcProvider } from "./__mock__/providers";
import {
  params,
  slashingTx,
  stakerInfo,
  stakingInput,
  stakingTx,
  unboundingTx,
  version,
} from "./__mock__/withdrawal";
import { ContractId } from "../../../src/types/contract";
import { ActionName } from "../../../src/types/action";

describe("Staking Manager", () => {
  describe("Create Withdrawal Transaction", () => {
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
    });

    // Early Unbonded
    describe("createSignedBtcWithdrawEarlyUnbondedTransaction", () => {
      it("should validate version params", async () => {
        const version = 5;

        try {
          await manager.createSignedBtcWithdrawEarlyUnbondedTransaction(
            stakerInfo,
            stakingInput,
            version,
            unboundingTx,
            4,
          );
        } catch (e: any) {
          expect(e.message).toMatch(
            `Babylon params not found for version ${version}`,
          );
        }
      });

      it("should create withdrawal tx", async () => {
        const unbondingPsbt =
          "70736274ff01005e020000000157b41412aa878b560867e9e97b52247555a7016a679e59dc5084c728ecbe7091000000000005000000011823000000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b1c2500000000000022512006d056d1b3d0907ad731d3bc4e5960d6640ba606f107db6e3520757ae09cd3164215c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0802f5c2c331475f980037e78432f190e3d30cedf9b61556eba388ab7faad9dbd25200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad55b2c001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac00000";
        const signedUnbondingPsbt =
          "70736274ff01005e020000000157b41412aa878b560867e9e97b52247555a7016a679e59dc5084c728ecbe7091000000000005000000011823000000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b1c2500000000000022512006d056d1b3d0907ad731d3bc4e5960d6640ba606f107db6e3520757ae09cd3160108a903405ff651c35d926db0c6a93e8852cb6d3d59e0355a2c6f09aaef817e406887fe9e8f4f05b64e0efab47ab8670e8b8891e8df60a43eb402cc63197a224890c3ed1f24200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad55b241c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0802f5c2c331475f980037e78432f190e3d30cedf9b61556eba388ab7faad9dbd0000";
        btcProvider.signPsbt.mockResolvedValueOnce(signedUnbondingPsbt);

        const { transaction, fee } =
          await manager.createSignedBtcWithdrawEarlyUnbondedTransaction(
            stakerInfo,
            stakingInput,
            version,
            unboundingTx,
            4,
          );

        expect(btcProvider.signPsbt).toHaveBeenCalledWith(unbondingPsbt, {
          contracts: [
            {
              id: ContractId.WITHDRAW,
              params: {
                stakerPk: stakerInfo.publicKeyNoCoordHex,
                timelockBlocks: params[version].unbondingTime,
              },
            },
          ],
          action: {
            name: ActionName.SIGN_BTC_WITHDRAW_TRANSACTION,
          },
        });
        expect(transaction.toHex()).toBe(
          Psbt.fromHex(signedUnbondingPsbt).extractTransaction().toHex(),
        );
        expect(fee).toEqual(516);
      });
    });

    // Staking Expired
    describe("createSignedBtcWithdrawStakingExpiredTransaction", () => {
      it("should validate version params", async () => {
        const version = 5;

        try {
          await manager.createSignedBtcWithdrawStakingExpiredTransaction(
            stakerInfo,
            stakingInput,
            version,
            stakingTx,
            4,
          );
        } catch (e: any) {
          expect(e.message).toMatch(
            `Babylon params not found for version ${version}`,
          );
        }
      });

      it("should create withdrawal tx", async () => {
        const withdrawPsbt =
          "70736274ff01005e0200000001260d8608c71a9dbe5573a2d25450bc1830c7ace5a9615016e1e5dabac32af0d1000000000064000000010c25000000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b1027000000000000225120de38b90b3e98822941d246c36859553591477a0b0eeb25a5bcda525b98849ecf6215c050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac08317b993160b148500d8fc1f6520c7f8ead4ae9537268552dcc20238fb6bb3f5802f5c2c331475f980037e78432f190e3d30cedf9b61556eba388ab7faad9dbd26200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad0164b2c001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac00000";
        const signedwithdrawPsbt =
          "70736274ff01005e0200000001260d8608c71a9dbe5573a2d25450bc1830c7ace5a9615016e1e5dabac32af0d1000000000064000000010c25000000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b1027000000000000225120de38b90b3e98822941d246c36859553591477a0b0eeb25a5bcda525b98849ecf0108ca0340726cd5ac48fe5728720d4179a68d4fe59076762f980626a82bc83c9d89c750364b4cd9d0a5acbf9259e2fe3977c7becc5e16b24dde88fe2792095b23ada1ffdf25200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad0164b261c050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac08317b993160b148500d8fc1f6520c7f8ead4ae9537268552dcc20238fb6bb3f5802f5c2c331475f980037e78432f190e3d30cedf9b61556eba388ab7faad9dbd0000";
        btcProvider.signPsbt.mockResolvedValueOnce(signedwithdrawPsbt);

        const { transaction, fee } =
          await manager.createSignedBtcWithdrawStakingExpiredTransaction(
            stakerInfo,
            stakingInput,
            version,
            
            stakingTx,
            4,
          );

        expect(btcProvider.signPsbt).toHaveBeenCalledWith(withdrawPsbt, {
          contracts: [
            {
              id: ContractId.WITHDRAW,
              params: {
                stakerPk: stakerInfo.publicKeyNoCoordHex,
                timelockBlocks: stakingInput.stakingTimelock,
              },
            },
          ],
          action: {
            name: ActionName.SIGN_BTC_WITHDRAW_TRANSACTION,
          },
        });
        expect(transaction.toHex()).toBe(
          Psbt.fromHex(signedwithdrawPsbt).extractTransaction().toHex(),
        );
        expect(fee).toEqual(516);
      });
    });

    // Slashed
    describe("createSignedBtcWithdrawSlashingTransaction", () => {
      it("should validate version params", async () => {
        const version = 5;

        try {
          await manager.createSignedBtcWithdrawSlashingTransaction(
            stakerInfo,
            stakingInput,
            version,
            slashingTx,
            2,
          );
        } catch (e: any) {
          expect(e.message).toMatch(
            `Babylon params not found for version ${version}`,
          );
        }
      });

      it("should create withdrawal tx", async () => {
        const slashingPsbt =
          "70736274ff01005e02000000019756644d209e088a6d0f29a20bd5bcc60496a6d2302df0e29019f3f4f572cc6101000000000500000001201e000000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b401f00000000000022512032ce4567cd1a74ae293fc51b5afbfd6b166051ab6aee1c6b9aacace60eeb5ac42215c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac025200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad55b2c001172050929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac00000";
        const signedSlashingPsbt =
          "70736274ff01005e02000000019756644d209e088a6d0f29a20bd5bcc60496a6d2302df0e29019f3f4f572cc6101000000000500000001201e000000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b401f00000000000022512032ce4567cd1a74ae293fc51b5afbfd6b166051ab6aee1c6b9aacace60eeb5ac401088903402692ff631a6a6ce5dfdf33ed2d3e9573d7752cbc4ad98f8d117417c24d7b2a4f98458aa7c4e95f59bcf1c41b80e4a433867f3dd4540ad121f0a546b7945a5fec24200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad55b221c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac00000";
        btcProvider.signPsbt.mockResolvedValueOnce(signedSlashingPsbt);

        const { transaction, fee } =
          await manager.createSignedBtcWithdrawSlashingTransaction(
            stakerInfo,
            stakingInput,
            version,
            slashingTx,
            2,
          );

        expect(btcProvider.signPsbt).toHaveBeenCalledWith(slashingPsbt, {
          contracts: [
            {
              id: ContractId.WITHDRAW,
              params: {
                stakerPk: stakerInfo.publicKeyNoCoordHex,
                timelockBlocks: params[version].unbondingTime,
              },
            },
          ],
          action: {
            name: ActionName.SIGN_BTC_WITHDRAW_TRANSACTION,
          },
        });

        expect(transaction.toHex()).toBe(
          Psbt.fromHex(signedSlashingPsbt).extractTransaction().toHex(),
        );
        expect(fee).toEqual(288);
      });
    });
  });
});
