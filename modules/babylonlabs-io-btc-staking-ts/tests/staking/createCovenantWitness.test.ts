import { Buffer } from "buffer";
import { createCovenantWitness } from "../../src";

describe("createCovenantWitness", () => {
  it("should return the correct witness when multiple covenants are matched", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [
      Buffer.from("covenant1", "utf-8"),
      Buffer.from("covenant2", "utf-8"),
    ];
    const covenantSigs = [
      // 'covenant1' and 'signature1' in hex
      { btcPkHex: "636f76656e616e7431", sigHex: "7369676e617475726531" },
      // 'covenant2' and 'signature2' in hex
      { btcPkHex: "636f76656e616e7432", sigHex: "7369676e617475726532" },
    ];
    const covenantQuorum = 2;

    const result = createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    );

    expect(result).toEqual([
      Buffer.from("7369676e617475726532", "hex"), // 'signature2' in hex
      Buffer.from("7369676e617475726531", "hex"), // 'signature1' in hex
      ...originalWitness,
    ]);
  });

  it("should throw error if not enough covenant signatures", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [
      Buffer.from("covenant1", "utf-8"),
      Buffer.from("covenant2", "utf-8"),
    ];
    const covenantSigs = [
      // 'covenant1' and 'signature1' in hex
      { btcPkHex: "636f76656e616e7431", sigHex: "7369676e617475726531" },
    ];
    const covenantQuorum = 2;

    expect(() => createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    )).toThrow("Not enough covenant signatures. Required: 2, got: 1");
  });

  it("should throw error if not enough valid covenant signatures after filtering", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [
      Buffer.from("covenant1", "utf-8"),
      Buffer.from("covenant2", "utf-8"),
    ];
    const covenantSigs = [
      // Valid signature for covenant1
      { btcPkHex: "636f76656e616e7431", sigHex: "7369676e617475726531" },
      // Invalid signature - doesn't match any params covenant
      { btcPkHex: "696e76616c6964636f76", sigHex: "696e76616c6964736967" },
    ];
    const covenantQuorum = 2;

    expect(() => createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    )).toThrow("Not enough valid covenant signatures. Required: 2, got: 1");
  });

  it("should throw error if all covenant signatures are invalid", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [
      Buffer.from("covenant1", "utf-8"),
      Buffer.from("covenant2", "utf-8"),
    ];
    const covenantSigs = [
      // Invalid signature - doesn't match any params covenant
      { btcPkHex: "696e76616c6964636f76", sigHex: "696e76616c6964736967" },
      // Another invalid signature
      { btcPkHex: "616e6f74686572696e76", sigHex: "616e6f74686572736967" },
    ];
    const covenantQuorum = 2;

    expect(() => createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    )).toThrow("Not enough valid covenant signatures. Required: 2, got: 0");
  });

  it("should work with mixed valid and invalid signatures when enough valid ones exist", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [
      Buffer.from("covenant1", "utf-8"),
      Buffer.from("covenant2", "utf-8"),
    ];
    const covenantSigs = [
      // Valid signature for covenant1
      { btcPkHex: "636f76656e616e7431", sigHex: "7369676e617475726531" },
      // Valid signature for covenant2
      { btcPkHex: "636f76656e616e7432", sigHex: "7369676e617475726532" },
      // Invalid signature - should be ignored
      { btcPkHex: "696e76616c6964636f76", sigHex: "696e76616c6964736967" },
    ];
    const covenantQuorum = 2;

    const result = createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    );

    expect(result).toEqual([
      Buffer.from("7369676e617475726532", "hex"), // 'signature2' in hex
      Buffer.from("7369676e617475726531", "hex"), // 'signature1' in hex
      ...originalWitness,
    ]);
  });

  it("should work with quorum of 1 when exactly one valid signature is provided", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [
      Buffer.from("covenant1", "utf-8"),
    ];
    const covenantSigs = [
      // Valid signature for covenant1
      { btcPkHex: "636f76656e616e7431", sigHex: "7369676e617475726531" },
    ];
    const covenantQuorum = 1;

    const result = createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    );

    expect(result).toEqual([
      Buffer.from("7369676e617475726531", "hex"), // 'signature1' in hex
      ...originalWitness,
    ]);
  });

  it("should throw error when quorum is 1 but no valid signatures are provided", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [
      Buffer.from("covenant1", "utf-8"),
    ];
    const covenantSigs = [
      // Invalid signature - doesn't match params covenant
      { btcPkHex: "696e76616c6964636f76", sigHex: "696e76616c6964736967" },
    ];
    const covenantQuorum = 1;

    expect(() => createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    )).toThrow("Not enough valid covenant signatures. Required: 1, got: 0");
  });
});
