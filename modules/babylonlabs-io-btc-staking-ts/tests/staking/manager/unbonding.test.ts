import { networks, Psbt, Transaction } from "bitcoinjs-lib";

import { BabylonBtcStakingManager } from "../../../src/staking/manager";

import { ContractId } from "../../../src/types/contract";
import { babylonProvider, btcProvider } from "./__mock__/providers";
import {
  covenantUnbondingSignatures,
  params,
  stakerInfo,
  stakingInput,
  stakingTx,
  unbondingPsbt,
  version,
} from "./__mock__/unbonding";
import { ActionName } from "../../../src/types/action";

describe("Staking Manager", () => {
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

  describe("createPartialSignedBtcUnbondingTransaction", () => {
    it("should validate version params", async () => {
      const version = 5;

      try {
        await manager.createPartialSignedBtcUnbondingTransaction(
          stakerInfo,
          stakingInput,
          version,
          stakingTx,
        );
      } catch (e: any) {
        expect(e.message).toMatch(
          `Babylon params not found for version ${version}`,
        );
      }
    });

    it("should create partial signed unbonding tx", async () => {
      const signedUnbondingTx =
        "70736274ff01005e02000000011e70a47d4ad5d4b67f428797805d888a0bf8bc74bbf6a34f6651b4765524d4c60000000000ffffffff01042900000000000022512084a0af8755a320a6cd0d7d12192322c716a71ce50831316733a276baf649b944000000000001012bf82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a30108fd2f010340beff4acba24751a509a56ce297ad6726fb3c8b8d3ec83113b2700d58217f2d9d99810d46f6a2ac74e863522e22a11523cf2d176db1c40ddc8f98951b380c96768a200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad2059d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4ac20a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31ba20ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5ba529c61c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0822a15c402bc3de196e9dfe6d4bcf9b55978f4da73fb0b18ebc083136ee58a3baf6b354e2c079c6d444ef391f391ece3b06e354895586ccb9847aa6a0ab141560000";
      btcProvider.signPsbt.mockResolvedValueOnce(signedUnbondingTx);

      const { transaction, fee } =
        await manager.createPartialSignedBtcUnbondingTransaction(
          stakerInfo,
          stakingInput,
          version,
          stakingTx,
        );

      expect(btcProvider.signPsbt).toHaveBeenLastCalledWith(unbondingPsbt, {
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
        ],
        action: {
          name: ActionName.SIGN_BTC_UNBONDING_TRANSACTION,
        },
      });
      expect(transaction).toEqual(
        Psbt.fromHex(signedUnbondingTx).extractTransaction(),
      );
      expect(fee).toEqual(500);
    });
  });

  describe("createSignedBtcUnbondingTransaction", () => {
    it("should validate version params", async () => {
      const version = 5;
      const unbondingTx = Transaction.fromHex(
        "02000000011e70a47d4ad5d4b67f428797805d888a0bf8bc74bbf6a34f6651b4765524d4c60000000000ffffffff01042900000000000022512084a0af8755a320a6cd0d7d12192322c716a71ce50831316733a276baf649b94400000000",
      );

      try {
        await manager.createSignedBtcUnbondingTransaction(
          stakerInfo,
          stakingInput,
          version,
          stakingTx,
          unbondingTx,
          covenantUnbondingSignatures,
        );
      } catch (e: any) {
        expect(e.message).toMatch(
          `Babylon params not found for version ${version}`,
        );
      }
    });

    it("should validate unbonding tx", async () => {
      const signedUnbondingTx =
        "70736274ff01005e02000000011e70a47d4ad5d4b67f428797805d888a0bf8bc74bbf6a34f6651b4765524d4c60000000000ffffffff01042900000000000022512084a0af8755a320a6cd0d7d12192322c716a71ce50831316733a276baf649b944000000000001012bf82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a30108fd2f010340beff4acba24751a509a56ce297ad6726fb3c8b8d3ec83113b2700d58217f2d9d99810d46f6a2ac74e863522e22a11523cf2d176db1c40ddc8f98951b380c96768a200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad2059d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4ac20a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31ba20ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5ba529c61c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0822a15c402bc3de196e9dfe6d4bcf9b55978f4da73fb0b18ebc083136ee58a3baf6b354e2c079c6d444ef391f391ece3b06e354895586ccb9847aa6a0ab141560000";
      const unbondingTx = Transaction.fromHex(
        "02000000013ceeae53363582ad438aa20b0e95917b01d8eb8c15b030f5cbfcd90587dfaf720000000000ffffffff01ac84010000000000225120453e6f3b8f487fb51b9e598e08eb83febb6e6d0d749c883b1696bbe1a269722600000000",
      );
      btcProvider.signPsbt.mockResolvedValueOnce(signedUnbondingTx);

      try {
        await manager.createSignedBtcUnbondingTransaction(
          stakerInfo,
          stakingInput,
          version,
          stakingTx,
          unbondingTx,
          covenantUnbondingSignatures,
        );
      } catch (e: any) {
        expect(e.message).toMatch(
          "Unbonding transaction hash does not match the computed hash",
        );
      }
    });

    it("should validate version params", async () => {
      const signedUnbondingTx =
        "70736274ff01005e02000000011e70a47d4ad5d4b67f428797805d888a0bf8bc74bbf6a34f6651b4765524d4c60000000000ffffffff01042900000000000022512084a0af8755a320a6cd0d7d12192322c716a71ce50831316733a276baf649b944000000000001012bf82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a30108fd2f010340beff4acba24751a509a56ce297ad6726fb3c8b8d3ec83113b2700d58217f2d9d99810d46f6a2ac74e863522e22a11523cf2d176db1c40ddc8f98951b380c96768a200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad2059d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4ac20a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31ba20ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5ba529c61c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0822a15c402bc3de196e9dfe6d4bcf9b55978f4da73fb0b18ebc083136ee58a3baf6b354e2c079c6d444ef391f391ece3b06e354895586ccb9847aa6a0ab141560000";
      const unbondingTx = Transaction.fromHex(
        "02000000011e70a47d4ad5d4b67f428797805d888a0bf8bc74bbf6a34f6651b4765524d4c60000000000ffffffff01042900000000000022512084a0af8755a320a6cd0d7d12192322c716a71ce50831316733a276baf649b94400000000",
      );
      btcProvider.signPsbt.mockResolvedValueOnce(signedUnbondingTx);

      const { transaction, fee } =
        await manager.createSignedBtcUnbondingTransaction(
          stakerInfo,
          stakingInput,
          version,
          stakingTx,
          unbondingTx,
          covenantUnbondingSignatures,
        );

      expect(fee).toEqual(500);
      expect(transaction.toHex()).toBe(
        "020000000001011e70a47d4ad5d4b67f428797805d888a0bf8bc74bbf6a34f6651b4765524d4c60000000000ffffffff01042900000000000022512084a0af8755a320a6cd0d7d12192322c716a71ce50831316733a276baf649b944064045f23ff78495e8d35b06b504017ff0f57c6d1a48878359675fd51e2e52570910a0e61439761cddcb4a5956a333a943c4937ff13514dd582cdf48435066311f17406bcfc07a4b0caa6f047821e6553bad8a4e3a8f134d41619566a8f2b926ea1fa838d4a098eb2ea8516bc1e6f4ea53d23b6af3acc14b9dfb5fbcb57a9756e326060040beff4acba24751a509a56ce297ad6726fb3c8b8d3ec83113b2700d58217f2d9d99810d46f6a2ac74e863522e22a11523cf2d176db1c40ddc8f98951b380c96768a200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0cad2059d3532148a597a2d05c0395bf5f7176044b1cd312f37701a9b4d0aad70bc5a4ac20a5c60c2188e833d39d0fa798ab3f69aa12ed3dd2f3bad659effa252782de3c31ba20ffeaec52a9b407b355ef6967a7ffc15fd6c3fe07de2844d61550475e7a5233e5ba529c61c150929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0822a15c402bc3de196e9dfe6d4bcf9b55978f4da73fb0b18ebc083136ee58a3baf6b354e2c079c6d444ef391f391ece3b06e354895586ccb9847aa6a0ab1415600000000",
      );
    });
  });
});
