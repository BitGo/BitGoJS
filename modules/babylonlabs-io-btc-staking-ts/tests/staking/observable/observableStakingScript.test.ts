import { opcodes, script } from "bitcoinjs-lib";
import { ObservableStakingScriptData } from "../../../src";

describe("observableStakingScript", () => {
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
  const magicBytes = Buffer.from("62626234", "hex");

  describe("Error path", () => {
    it("should throw if more than one finality providers when building data embed script", () => {
      const script = new ObservableStakingScriptData(
        pk1, // Staker Pk
        [pk2, pk6], // More than one FP Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
        magicBytes
      );
      expect(() =>
        script.buildDataEmbedScript()
      ).toThrow("Only a single finality provider key is supported");
    });

    it("should fail if the magic bytes are below 4 in length", () => {
      expect(
        () =>
          new ObservableStakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            unbondingTimeLock,
            Buffer.from("aaaaaa", "hex"),
          ),
      ).toThrow("Invalid script data provided");
    });
    it("should fail if the magic bytes are above 4 in length", () => {
      expect(
        () =>
          new ObservableStakingScriptData(
            pk1, // Staker Pk
            [pk2], // Finality Provider Pks
            [pk3, pk4, pk5], // covenant Pks
            2,
            stakingTimeLock,
            unbondingTimeLock,
            Buffer.from("aaaaaaaaaa", "hex"),
          ),
      ).toThrow("Invalid script data provided");
    });
  });

  describe("Happy path", () => {
    it("should succeed with valid input data", () => {
      const scriptData = new ObservableStakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
        magicBytes,
      );
      expect(scriptData).toBeInstanceOf(ObservableStakingScriptData);
    });

    it("should build valid data embed script", () => {
      const scriptData = new ObservableStakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
        magicBytes,
      );
      const dataEmbedScript = scriptData.buildDataEmbedScript();
      const decompiled = script.decompile(dataEmbedScript);
      expect(decompiled).toEqual([
        opcodes.OP_RETURN,
        Buffer.concat([
          magicBytes,
          Buffer.from([0]), // Version byte
          pk1,
          pk2,
          Buffer.from([stakingTimeLock >> 8, stakingTimeLock & 0xff]), // Staking timelock in big endian
        ]),
      ]);
    });

    it("should build valid staking scripts", () => {
      const scriptData = new ObservableStakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
        magicBytes,
      );
      const scripts = scriptData.buildScripts();
      expect(scripts).toHaveProperty("timelockScript");
      expect(scripts).toHaveProperty("unbondingScript");
      expect(scripts).toHaveProperty("slashingScript");
      expect(scripts).toHaveProperty("unbondingTimelockScript");
      expect(scripts).toHaveProperty("dataEmbedScript");
    });

    it("should validate correctly with valid input data", () => {
      const scriptData = new ObservableStakingScriptData(
        pk1, // Staker Pk
        [pk2], // Finality Provider Pks
        [pk3, pk4, pk5], // covenant Pks
        2,
        stakingTimeLock,
        unbondingTimeLock,
        magicBytes,
      );
      expect(scriptData.validate()).toBe(true);
    });
  });
});
