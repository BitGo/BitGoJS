import { opcodes, script } from "bitcoinjs-lib";
import { StakingScriptData } from "../../src";

describe("stakingScript", () => {
  const pk1 = Buffer.from(
    "6f13a6d104446520d1757caec13eaf6fbcf29f488c31e0107e7351d4994cd068",
    "hex",
  );
  const pk2 = Buffer.from(
    "f5199efae3f28bb82476163a7e458c7ad445d9bffb0682d10d3bdb2cb41f8e8e",
    "hex",
  );
  const pk3 = Buffer.from(
    "17921cf156ccb4e73d428f996ed11b245313e37e27c978ac4d2cc21eca4672e4",
    "hex",
  );
  const pk4 = Buffer.from(
    "76d1ae01f8fb6bf30108731c884cddcf57ef6eef2d9d9559e130894e0e40c62c",
    "hex",
  );
  const pk5 = Buffer.from(
    "49766ccd9e3cd94343e2040474a77fb37cdfd30530d05f9f1e96ae1e2102c86e",
    "hex",
  );
  const pk6 = Buffer.from(
    "063deb187a4bf11c114cf825a4726e4c2c35fea5c4c44a20ff08a30a752ec7e0",
    "hex",
  );
  const invalidPk = Buffer.from(
    "6f13a6d104446520d1757caec13eaf6fbcf29f488c31e0107e7351d4994cd0",
    "hex",
  );
  const stakingTimeLock = 65535;
  const unbondingTimeLock = 1000;

  describe("Error path", () => {
    it("should fail if the staker key is not 32 bytes", () => {
      expect(
        () =>
          new StakingScriptData(
            invalidPk, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            unbondingTimeLock,
          ),
      ).toThrow("Invalid script data provided");
    });

    it("should fail if a finality provider key is not 32 bytes", () => {
      expect(() =>
        new StakingScriptData(
          pk1, // Staker Pk
          [pk2, invalidPk], // Finality Provider Pks
          [pk3, pk4, pk5], // covenant Pks
          2,
          stakingTimeLock,
          unbondingTimeLock,
        )
      ).toThrow("Invalid script data provided");
    });

    it("should fail if a covenant emulator key is not 32 bytes", () => {
      expect(() =>
        new StakingScriptData(
          pk1, // Staker Pk
          [pk2, pk3], // Finality Provider Pks
          [pk4, invalidPk, pk5], // covenant Pks
          2,
          stakingTimeLock,
          unbondingTimeLock,
        )
      ).toThrow("Invalid script data provided");
    });

    it("should fail if the covenant emulators threshold is 0", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            0,
            stakingTimeLock,
            unbondingTimeLock,
          ),
      ).toThrow("Missing required input values");
    });

    it("should fail if the covenant emulators threshold is larger than the covenant emulators", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            4,
            stakingTimeLock,
            unbondingTimeLock,
          ),
      ).toThrow("Invalid script data provided");
    });

    it("should fail if the staking timelock is 0", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            0,
            unbondingTimeLock,
          ),
      ).toThrow("Missing required input values");
    });

    it("should fail if the staking timelock is above the maximum", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            65536,
            unbondingTimeLock,
          ),
      ).toThrow("Invalid script data provided");
    });

    it("should fail if the unbonding timelock is 0", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            0,
          ),
      ).toThrow("Missing required input values");
    });

    it("should fail if the unbonding timelock is above the maximum", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            65536,
          ),
      ).toThrow("Invalid script data provided");
    });

    it("should fail if the staker pk is in the finality providers list", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2, pk1], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            unbondingTimeLock,
          ),
      ).toThrow("Invalid script data provided");
    });

    it("should fail if the staker pk is in the covenants list", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk1, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            unbondingTimeLock,
          ),
      ).toThrow("Invalid script data provided");
    });

    it("should fail if a finality provider pk is in the covenants list", () => {
      expect(
        () =>
          new StakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk2, pk3, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            unbondingTimeLock,
          ),
      ).toThrow("Invalid script data provided");
    });
  });

  describe("Happy path", () => {
    it("should succeed with valid input data", () => {
      const scriptData = new StakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );
      expect(scriptData).toBeInstanceOf(StakingScriptData);
    });

    it("should build valid staking timelock script", () => {
      const scriptData = new StakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );
      const timelockScript = scriptData.buildStakingTimelockScript();
      const decompiled = script.decompile(timelockScript);
      expect(decompiled).toEqual([
        pk1,
        opcodes.OP_CHECKSIGVERIFY,
        script.number.encode(stakingTimeLock),
        opcodes.OP_CHECKSEQUENCEVERIFY,
      ]);
    });

    it("should build valid unbonding timelock script", () => {
      const scriptData = new StakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );
      const unbondingTimelockScript =
      scriptData.buildUnbondingTimelockScript();
      const decompiled = script.decompile(unbondingTimelockScript);
      expect(decompiled).toEqual([
        pk1,
        opcodes.OP_CHECKSIGVERIFY,
        script.number.encode(unbondingTimeLock),
        opcodes.OP_CHECKSEQUENCEVERIFY,
      ]);
    });

    it("should build valid unbonding script", () => {
      const pks = [pk3, pk4, pk5];
      const scriptData = new StakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        pks, // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );

      const sortedPks = [...pks].sort(Buffer.compare);

      const unbondingScript = scriptData.buildUnbondingScript();
      const decompiled = script.decompile(unbondingScript);

      const expectedScript = script.decompile(
        Buffer.concat([
          script.compile([pk1, opcodes.OP_CHECKSIGVERIFY]),
          script.compile([
            sortedPks[0],
            opcodes.OP_CHECKSIG,
            sortedPks[1],
            opcodes.OP_CHECKSIGADD,
            sortedPks[2],
            opcodes.OP_CHECKSIGADD,
            script.number.encode(2),
            opcodes.OP_NUMEQUAL,
          ]),
        ]),
      );

      expect(decompiled).toEqual(expectedScript);
    });

    it("should build valid slashing script", () => {
      const pks = [pk3, pk4, pk5];
      const scriptData = new StakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        pks, // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );

      const sortedPks = [...pks].sort(Buffer.compare);

      const slashingScript = scriptData.buildSlashingScript();
      const decompiled = script.decompile(slashingScript);

      const expectedScript = script.decompile(
        Buffer.concat([
          script.compile([pk1, opcodes.OP_CHECKSIGVERIFY]),
          script.compile([pk2, opcodes.OP_CHECKSIGVERIFY]),
          script.compile([
            sortedPks[0],
            opcodes.OP_CHECKSIG,
            sortedPks[1],
            opcodes.OP_CHECKSIGADD,
            sortedPks[2],
            opcodes.OP_CHECKSIGADD,
            script.number.encode(2),
            opcodes.OP_NUMEQUAL,
          ]),
        ]),
      );

      expect(decompiled).toEqual(expectedScript);
    });

    it("should build valid staking scripts", () => {
      const scriptData = new StakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );
      const scripts = scriptData.buildScripts();
      expect(scripts).toHaveProperty("timelockScript");
      expect(scripts).toHaveProperty("unbondingScript");
      expect(scripts).toHaveProperty("slashingScript");
      expect(scripts).toHaveProperty("unbondingTimelockScript");
      // We don't expect the data embed script to be present
      expect(scripts).not.toHaveProperty("dataEmbedScript");
    });

    it("should validate correctly with valid input data", () => {
      const scriptData = new StakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );
      expect(scriptData.validate()).toBe(true);
    });

    it("should validate correctly with minimum valid staking and unbonding timelock", () => {
      const scriptData = new StakingScriptData(
        pk1,
        [pk2],
        [pk3, pk4, pk5],
        2,
        1, // Minimum valid staking timelock
        1, // Minimum valid unbonding timelock
      );
      expect(scriptData.validate()).toBe(true);
    });

    it("should validate correctly with unique keys", () => {
      const scriptData = new StakingScriptData(
        pk1,
        [pk2],
        [pk3, pk4, pk5],
        2,
        stakingTimeLock,
        unbondingTimeLock,
      );
      expect(scriptData.validate()).toBe(true);
    });

    it("should handle maximum valid staking and unbonding timelock", () => {
      const scriptData = new StakingScriptData(
        pk1,
        [pk2],
        [pk3, pk4, pk5],
        2,
        65535, // Maximum valid staking timelock
        65535, // Maximum valid unbonding timelock
      );
      expect(scriptData.validate()).toBe(true);
    });
  });
});
