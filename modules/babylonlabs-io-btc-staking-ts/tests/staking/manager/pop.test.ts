import { networks } from "bitcoinjs-lib";
import { sha256 } from "bitcoinjs-lib/src/crypto";

import { BabylonBtcStakingManager } from "../../../src/staking/manager";
import { STAKING_MODULE_ADDRESS } from "../../../src/constants/staking";

import { babylonProvider, btcProvider, mockChainId } from "./__mock__/providers";
import { params, stakerInfo } from "./__mock__/staking";
import { babylonAddress } from "./__mock__/fee";

describe("Staking Manager - POP Integration", () => {
  const mockBech32Address = babylonAddress;
  const mockBtcAddress = stakerInfo.address;

  beforeEach(() => {
    jest.clearAllMocks();
    btcProvider.signMessage.mockResolvedValue("mocked-signature");
    babylonProvider.getChainId.mockResolvedValue(mockChainId);
  });

  describe("Legacy POP Format (Below Upgrade Height)", () => {
    it("should use legacy format when height is below upgrade height", async () => {
      const mockGetCurrentHeight = jest.fn().mockResolvedValue(100);
      babylonProvider.getCurrentHeight.mockImplementation(mockGetCurrentHeight);

      const upgradeConfig = {
        upgradeHeight: 200,
        version: 0,
      };
      const manager = new BabylonBtcStakingManager(
        networks.bitcoin,
        params,
        btcProvider,
        babylonProvider,
        undefined,
        {
          pop: upgradeConfig,
        },
      );

      await manager.createProofOfPossession(
        "delegation:create",
        mockBech32Address,
        mockBtcAddress,
      );

      // Should sign just the bech32 address (legacy format)
      expect(btcProvider.signMessage).toHaveBeenCalledWith(
        mockBech32Address,
        "ecdsa",
      );
      expect(mockGetCurrentHeight).toHaveBeenCalled();
    });

    it("should use legacy format when no upgrade options provided and optional babylon provider methods are not provided", async () => {
      babylonProvider.getCurrentHeight.mockResolvedValue(undefined);
      babylonProvider.getChainId.mockResolvedValue(undefined);

      const manager = new BabylonBtcStakingManager(
        networks.bitcoin,
        params,
        btcProvider,
        babylonProvider,
      );

      await manager.createProofOfPossession(
        "delegation:create",
        mockBech32Address,
        mockBtcAddress,
      );

      // Should sign just the bech32 address (legacy format)
      expect(btcProvider.signMessage).toHaveBeenCalledWith(
        mockBech32Address,
        "ecdsa",
      );
    });
  });

  describe("New POP Format (Above Upgrade Height)", () => {
    it("should use new format when height is above upgrade height", async () => {
      const mockGetCurrentHeight = jest.fn().mockResolvedValue(300);
      babylonProvider.getCurrentHeight.mockImplementation(mockGetCurrentHeight);
      
      const upgradeConfig = {
        upgradeHeight: 200,
        version: 0,
      };
      const manager = new BabylonBtcStakingManager(
        networks.bitcoin,
        params,
        btcProvider,
        babylonProvider,
        undefined,
        {
          pop: upgradeConfig,
        },
      );

      await manager.createProofOfPossession(
        "delegation:create",
        mockBech32Address,
        mockBtcAddress,
      );

      // Calculate expected message with context hash
      const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
      const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
      const expectedMessage = expectedContextHash + mockBech32Address;

      expect(btcProvider.signMessage).toHaveBeenCalledWith(
        expectedMessage,
        "ecdsa",
      );
      expect(mockGetCurrentHeight).toHaveBeenCalled();
    });

    it("should use new format when popContextUpgradeHeight is 0 (always use new format)", async () => {
      const mockGetCurrentHeight = jest.fn().mockResolvedValue(100);
      babylonProvider.getCurrentHeight.mockImplementation(mockGetCurrentHeight);

      const upgradeConfig = {
        upgradeHeight: 0,
        version: 0,
      };
      const manager = new BabylonBtcStakingManager(
        networks.bitcoin,
        params,
        btcProvider,
        babylonProvider,
        undefined,
        {
          pop: upgradeConfig,
        },
      );

      await manager.createProofOfPossession(
        "delegation:create",
        mockBech32Address,
        mockBtcAddress,
      );

      // Calculate expected message with context hash
      const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
      const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
      const expectedMessage = expectedContextHash + mockBech32Address;

      expect(btcProvider.signMessage).toHaveBeenCalledWith(
        expectedMessage,
        "ecdsa",
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw error when height detection fails", async () => {
      const mockGetCurrentHeight = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      babylonProvider.getCurrentHeight.mockImplementation(mockGetCurrentHeight);
      const upgradeConfig = {
        upgradeHeight: 200,
        version: 0,
      };

      const manager = new BabylonBtcStakingManager(
        networks.bitcoin,
        params,
        btcProvider,
        babylonProvider,
        undefined,
        {
          pop: upgradeConfig,
        },
      );

      await expect(
        manager.createProofOfPossession(
          "delegation:create",
          mockBech32Address,
          mockBtcAddress,
        ),
      ).rejects.toThrow("Network error");
    });
  });

  describe("BIP322 Support", () => {
    it("should use BIP322 signature for taproot addresses with new format", async () => {
      const mockTaprootAddress =
        "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297";
      const mockGetCurrentHeight = jest.fn().mockResolvedValue(300);
      babylonProvider.getCurrentHeight.mockImplementation(mockGetCurrentHeight);
      const upgradeConfig = {
        upgradeHeight: 200,
        version: 0,
      };
      
      const manager = new BabylonBtcStakingManager(
        networks.bitcoin,
        params,
        btcProvider,
        babylonProvider,
        undefined,
        {
          pop: upgradeConfig,
        },
      );

      await manager.createProofOfPossession(
        "delegation:create",
        mockBech32Address,
        mockTaprootAddress,
      );

      // Calculate expected message with context hash
      const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
      const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
      const expectedMessage = expectedContextHash + mockBech32Address;

      expect(btcProvider.signMessage).toHaveBeenCalledWith(
        expectedMessage,
        "bip322-simple",
      );
    });
  });
});