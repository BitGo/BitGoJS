import { networks, Psbt, Transaction } from "bitcoinjs-lib";

import { getPublicKeyNoCoord, type UTXO } from "../../../src";
import { BabylonBtcStakingManager } from "../../../src/staking/manager";

import { babylonProvider, btcProvider } from "./__mock__/providers";
import { params, stakerInfo, utxos } from "./__mock__/staking";
import { ContractId } from "../../../src/types/contract";
import { ActionName } from "../../../src/types/action";

const unsignedStakingTx = Transaction.fromHex(
  "0200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff02f82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a354da820000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce00000000",
);
const stakingInput = {
  stakingAmountSat: 11_000,
  finalityProviderPksNoCoordHex: [
    getPublicKeyNoCoord(
      "02eb83395c33cf784f7dfb90dcc918b5620ddd67fe6617806f079322dc4db2f0",
    ),
  ],
  stakingTimelock: 100,
};
const version = 2;

describe("Staking Manager", () => {
  describe("createSignedBtcStakingTransaction", () => {
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

    it("should validate version params", async () => {
      const version = 5;

      try {
        await manager.createSignedBtcStakingTransaction(
          stakerInfo,
          stakingInput,
          unsignedStakingTx,
          utxos,
          version,
        );
      } catch (e: any) {
        expect(e.message).toMatch(
          `Babylon params not found for version ${version}`,
        );
      }
    });

    it("should validate input utxos", async () => {
      const utxos: UTXO[] = [];

      try {
        await manager.createSignedBtcStakingTransaction(
          stakerInfo,
          stakingInput,
          unsignedStakingTx,
          utxos,
          version,
        );
      } catch (e: any) {
        expect(e.message).toMatch("No input UTXOs provided");
      }
    });

    it("should sign staking tx", async () => {
      const unsignedTx =
        "70736274ff0100890200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff02f82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a354da820000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b0506830000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce0117200874876147fd7522d617e83bf845f7fb4981520e3c2f749ad4a2ca1bd660ef0c000000";
      const signedTx =
        "70736274ff0100890200000001d66d8d533edc3bcc5c5a5b0ec4b1ec7180761226cfe6a38e7af48fe2028c6a220100000000ffffffff02f82a000000000000225120c3177fd7052d79a2d50a5c60217f0b5855371fe5f9a5322bafa8fcd24a3c31a354da820000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce000000000001012b0506830000000000225120f8115abbfc76b4c0d938c09511b76bfe43332b7126534f1082d693f419a9adce01084201404039aac248eb40aaab21fd58556ad7d81e177df5119c7225b1e881fc6c64c106d2ba95865895050df5fe64a86f81f3273687056f97fd506c792ebce281d8dbb0000000";
      btcProvider.signPsbt.mockResolvedValueOnce(signedTx);

      const tx = await manager.createSignedBtcStakingTransaction(
        stakerInfo,
        stakingInput,
        unsignedStakingTx,
        utxos,
        version,
      );

      expect(btcProvider.signPsbt).toHaveBeenLastCalledWith(unsignedTx, {
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
        ],
        action: {
          name: ActionName.SIGN_BTC_STAKING_TRANSACTION,
        },
      });
      expect(tx).toEqual(Psbt.fromHex(signedTx).extractTransaction());
    });
  });
});
