import { Buffer } from "buffer";
import { createCovenantWitness } from "../../src";

describe("createCovenantWitness", () => {
  it("should return only originalWitness if no matches found", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [Buffer.from("covenant1", "utf-8")];
    const btcPkHex = "6e6f6e6578697374656e74";
    const covenantSigs = [
      { btcPkHex: btcPkHex, sigHex: "7369676e6174757265" }, // 'nonexistent' and 'signature' in hex
    ];
    const covenantQuorum = 1;

    expect(() => createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    )).toThrow(
      `Covenant signature public key ${btcPkHex} not found in params covenants`
    );
  });

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

  it("should throw error if covenant signature public key not found in params", () => {
    const originalWitness = [Buffer.from("originalWitness1", "utf-8")];
    const paramsCovenants = [Buffer.from("covenant1", "utf-8")];
    const covenantSigs = [
      { btcPkHex: "636f76656e616e7432", sigHex: "7369676e617475726532" }, // 'covenant2' and 'signature2' in hex
    ];
    const covenantQuorum = 1;

    expect(() => createCovenantWitness(
      originalWitness,
      paramsCovenants,
      covenantSigs,
      covenantQuorum
    )).toThrow("Covenant signature public key 636f76656e616e7432 not found in params covenants");
  });
});
