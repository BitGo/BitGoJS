import { script as bitcoinScript, opcodes, payments } from "bitcoinjs-lib";
import {
  DEFAULT_INPUT_SIZE,
  MAX_NON_LEGACY_OUTPUT_SIZE,
  P2TR_INPUT_SIZE,
  P2WPKH_INPUT_SIZE,
} from "../../../src/constants/fee";
import { UTXO } from "../../../src/types/UTXO";
import {
  getEstimatedChangeOutputSize,
  getInputSizeByScript,
  inputValueSum,
  isOP_RETURN,
} from "../../../src/utils/fee/utils";
import { testingNetworks } from "../../helper";

describe("is OP_RETURN", () => {
  it("should return true for an OP_RETURN script", () => {
    const script = bitcoinScript.compile([
      opcodes.OP_RETURN,
      Buffer.from("hello world"),
    ]);
    expect(isOP_RETURN(script)).toBe(true);
  });

  it("should return false for a non-OP_RETURN script", () => {
    const script = bitcoinScript.compile([
      opcodes.OP_DUP,
      opcodes.OP_HASH160,
      Buffer.alloc(20),
      opcodes.OP_EQUALVERIFY,
      opcodes.OP_CHECKSIG,
    ]);
    expect(isOP_RETURN(script)).toBe(false);
  });

  it("should return false for an invalid script", () => {
    const script = Buffer.from("invalidscript", "hex");
    expect(isOP_RETURN(script)).toBe(false);
  });
});

describe.each(testingNetworks)("scriptUtils", ({
  networkName,
  datagen,
}) => {
  describe.each(Object.values(datagen))(`${networkName} - getInputSizeByScript`, (
    dataGenerator
  ) => {
    it("should return P2WPKH_INPUT_SIZE for a valid P2WPKH script", () => {
      const pk = dataGenerator.generateRandomKeyPair().publicKey;
      const { output } = payments.p2wpkh({ pubkey: Buffer.from(pk, "hex") });
      if (output) {
        expect(getInputSizeByScript(output)).toBe(P2WPKH_INPUT_SIZE);
      }
    });

    it("should return P2TR_INPUT_SIZE for a valid P2TR script", () => {
      const pk = dataGenerator.generateRandomKeyPair().publicKeyNoCoord;
      const { output } = payments.p2tr({
        internalPubkey: Buffer.from(pk, "hex"),
      });
      expect(getInputSizeByScript(output!)).toBe(P2TR_INPUT_SIZE);
    });

    it("should return DEFAULT_INPUT_SIZE for an invalid or unrecognized script", () => {
      const script = bitcoinScript.compile([
        opcodes.OP_DUP,
        opcodes.OP_HASH160,
        Buffer.alloc(20),
        opcodes.OP_EQUALVERIFY,
        opcodes.OP_CHECKSIG,
      ]);
      expect(getInputSizeByScript(script)).toBe(DEFAULT_INPUT_SIZE);
    });

    it("should handle malformed scripts gracefully and return DEFAULT_INPUT_SIZE", () => {
      const malformedScript = Buffer.from("00", "hex");
      expect(getInputSizeByScript(malformedScript)).toBe(DEFAULT_INPUT_SIZE);
    });
  });
});

describe("getEstimatedChangeOutputSize", () => {
  it("should return correct value for the estimated change output size", () => {
    expect(getEstimatedChangeOutputSize()).toBe(MAX_NON_LEGACY_OUTPUT_SIZE);
  });
});

describe("inputValueSum", () => {
  it("should return the correct sum of UTXO values", () => {
    const inputUTXOs: UTXO[] = [
      { txid: "txid1", vout: 0, value: 5000, scriptPubKey: "script1" },
      { txid: "txid2", vout: 1, value: 10000, scriptPubKey: "script2" },
    ];
    const expectedSum = 15000;
    const actualSum = inputValueSum(inputUTXOs);
    expect(actualSum).toBe(expectedSum);
  });

  it("should return zero for an empty UTXO list", () => {
    const inputUTXOs: UTXO[] = [];
    const expectedSum = 0;
    const actualSum = inputValueSum(inputUTXOs);
    expect(actualSum).toBe(expectedSum);
  });

  it("should return the correct sum for UTXOs with varying values", () => {
    const inputUTXOs: UTXO[] = [
      { txid: "txid1", vout: 0, value: 2500, scriptPubKey: "script1" },
      { txid: "txid2", vout: 1, value: 7500, scriptPubKey: "script2" },
      { txid: "txid3", vout: 2, value: 10000, scriptPubKey: "script3" },
    ];
    const expectedSum = 20000;
    const actualSum = inputValueSum(inputUTXOs);
    expect(actualSum).toBe(expectedSum);
  });

  it("should handle large UTXO values correctly", () => {
    const inputUTXOs: UTXO[] = [
      { txid: "txid1", vout: 0, value: 2 ** 53 - 1, scriptPubKey: "script1" },
      { txid: "txid2", vout: 1, value: 1, scriptPubKey: "script2" },
    ];
    const expectedSum = 2 ** 53 - 1 + 1;
    const actualSum = inputValueSum(inputUTXOs);
    expect(actualSum).toBe(expectedSum);
  });
});
