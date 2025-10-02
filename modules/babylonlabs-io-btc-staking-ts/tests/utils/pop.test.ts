import { sha256 } from "bitcoinjs-lib/src/crypto";

import {
  createStakerPopContext,
  buildPopMessage,
} from "../../src/utils/pop";
import { PopUpgradeConfig } from "../../src/types";
import { STAKING_MODULE_ADDRESS } from "../../src/constants/staking";
import { babylonAddress } from "../staking/manager/__mock__/fee";
import { mockChainId } from "../staking/manager/__mock__/providers";

describe("POP Utility Functions", () => {
  const mockBech32Address = babylonAddress;

  describe("createStakerPopContext", () => {
    it("should generate correct context hash with default version", () => {
      const contextHash = createStakerPopContext(mockChainId);

      const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
      const expectedHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");

      expect(contextHash).toBe(expectedHash);
    });

    it("should generate correct context hash with custom version", () => {
      const contextHash = createStakerPopContext(mockChainId, 1);

      const expectedContextString = `btcstaking/1/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
      const expectedHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");

      expect(contextHash).toBe(expectedHash);
    });

    it("should generate correct context hash with version 2", () => {
      const contextHash = createStakerPopContext(mockChainId, 2);

      const expectedContextString = `btcstaking/2/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
      const expectedHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");

      expect(contextHash).toBe(expectedHash);
    });

    it("should handle empty chain ID", () => {
      const contextHash = createStakerPopContext("");

      const expectedContextString = `btcstaking/0/staker_pop//${STAKING_MODULE_ADDRESS}`;
      const expectedHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");

      expect(contextHash).toBe(expectedHash);
    });
  });

  describe("buildPopMessage", () => {
    const mockUpgradeConfig: PopUpgradeConfig = {
      upgradeHeight: 200,
      version: 0,
    };

    describe("Legacy Format", () => {
      it("should return bech32 address when no upgrade config provided", () => {
        const currentHeight = 300;
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
        );

        expect(result).toBe(mockBech32Address);
      });

      it("should return bech32 address when current height is below upgrade height", () => {
        const currentHeight = 100;
        const upgradeConfig = {
          upgradeHeight: mockUpgradeConfig.upgradeHeight,
          version: mockUpgradeConfig.version,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        expect(result).toBe(mockBech32Address);
      });

      it("should return bech32 address when upgrade height is undefined", () => {
        const result = buildPopMessage(
          mockBech32Address,
          300,
          mockChainId,
        );

        expect(result).toBe(mockBech32Address);
      });
    });

    describe("New Format", () => {
      it("should return context hash + address when current height equals upgrade height", () => {
        const currentHeight = 200;
        const upgradeConfig = {
          upgradeHeight: mockUpgradeConfig.upgradeHeight,
          version: mockUpgradeConfig.version,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });

      it("should return context hash + address when current height is above upgrade height", () => {
        const currentHeight = 300;
        const upgradeConfig = {
          upgradeHeight: mockUpgradeConfig.upgradeHeight,
          version: mockUpgradeConfig.version,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });

      it("should use custom version when provided", () => {
        const currentHeight = 300;
        const customConfig = {
          upgradeHeight: 200,
          version: 1,
        };

        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          customConfig,
        );

        const expectedContextString = `btcstaking/1/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });

      it("should always use new format when upgrade height is 0", () => {
        const currentHeight = 100;
        const customConfig: PopUpgradeConfig = {
          upgradeHeight: 0,
          version: 0,
        };

        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          customConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty bech32 address", () => {
        const currentHeight = 300;
        const upgradeConfig = {
          upgradeHeight: mockUpgradeConfig.upgradeHeight,
          version: mockUpgradeConfig.version,
        };

        const result = buildPopMessage(
          "",
          300,
          mockChainId,
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + "";

        expect(result).toBe(expectedMessage);
      });

      it("should handle very large height values", () => {
        const currentHeight = Number.MAX_SAFE_INTEGER;
        const upgradeConfig = {
          upgradeHeight: mockUpgradeConfig.upgradeHeight,
          version: mockUpgradeConfig.version,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });

      it("should handle empty chain ID", () => {
        const currentHeight = 300;
        const upgradeConfig = {
          upgradeHeight: mockUpgradeConfig.upgradeHeight,
          version: mockUpgradeConfig.version,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          "",
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop//${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });
    });
  });

  describe("buildPopMessage (createPopMessageToSign replacement)", () => {
    describe("Success Cases", () => {
      it("should return legacy format when no upgrade config provided", () => {
        const currentHeight = 300;
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
        );

        expect(result).toBe(mockBech32Address);
      });

      it("should return legacy format when height is below upgrade height", () => {
        const currentHeight = 100;
        const upgradeConfig = {
          upgradeHeight: 200,
          version: 0,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        expect(result).toBe(mockBech32Address);
      });

      it("should return new format when height is above upgrade height", () => {
        const currentHeight = 300;
        const upgradeConfig = {
          upgradeHeight: 200,
          version: 0,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });

      it("should use custom version when provided", () => {
        const currentHeight = 300;
        const upgradeConfig = {
          upgradeHeight: 200,
          version: 1,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/1/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty bech32 address", () => {
        const currentHeight = 100;
        const upgradeConfig = {
          upgradeHeight: 200,
          version: 0,
        };
        const result = buildPopMessage(
          "",
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        expect(result).toBe("");
      });

      it("should handle zero height", () => {
        const currentHeight = 0;
        const upgradeConfig: PopUpgradeConfig = {
          upgradeHeight: 0,
          version: 0,
        };

        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        // Should use new format since height (0) >= upgrade height (0)
        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });

      it("should handle very large height values", () => {
        const currentHeight = Number.MAX_SAFE_INTEGER;
        const upgradeConfig = {
          upgradeHeight: 1000,
          version: 0,
        };
        const result = buildPopMessage(
          mockBech32Address,
          currentHeight,
          mockChainId,
          upgradeConfig,
        );

        const expectedContextString = `btcstaking/0/staker_pop/${mockChainId}/${STAKING_MODULE_ADDRESS}`;
        const expectedContextHash = sha256(Buffer.from(expectedContextString, "utf8")).toString("hex");
        const expectedMessage = expectedContextHash + mockBech32Address;

        expect(result).toBe(expectedMessage);
      });
    });
  });
});