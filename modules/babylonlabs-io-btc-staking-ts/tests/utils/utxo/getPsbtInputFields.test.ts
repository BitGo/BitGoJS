import * as bitcoin from "bitcoinjs-lib";

import { UTXO } from "../../../src/types";
import { getPsbtInputFields } from "../../../src/utils/utxo/getPsbtInputFields";
import * as getScriptType from "../../../src/utils/utxo/getScriptType";
import testingNetworks from "../../helper/testingNetworks";

describe.each(testingNetworks)(
  "Get PSBT input fields for UTXOs",
  ({ network, datagen }) => {
    describe.each(Object.entries(datagen))(
      "using %s",
      (_dataGenName, dataGenerator) => {
        const dummyRawTxHex = "0200000001abcdef";
        const dummyRedeemScriptHex = "abcdef";
        const dummyValue = 10000

        // helper for this particular tests
        function makeUTXO(
          scriptPubKey: string,
          overrides?: Partial<UTXO>,
        ): UTXO {
          return {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            value: dummyValue,
            scriptPubKey,
            ...overrides,
          };
        }

        // this will throw from `getScriptType`
        it("throws if cannot get the script type", () => {
          const unknownScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_RETURN,
            Buffer.from("UNKNOWN"),
          ]);

          const utxo = makeUTXO(unknownScript.toString("hex"));
          expect(() => getPsbtInputFields(utxo)).toThrow("Unknown script type");
        });

        // this will throw from `getPsbtInputField`
        it("throws if the script type is not supported", () => {
          const unknownScript = "NOT_SUPPORTED_SCRIPT";

          // Save the spy so we can restore it
          const spy = jest
            .spyOn(getScriptType, "getScriptType")
            .mockImplementation(() => {
              return unknownScript as any;
            });

          try {
            const notSupportedScript = bitcoin.script.compile([
              bitcoin.opcodes.OP_RETURN,
              Buffer.from("UNKNOWN"),
            ]);
            const utxo = makeUTXO(notSupportedScript.toString("hex"));
            expect(() => getPsbtInputFields(utxo)).toThrow(
              `Unsupported script type: ${unknownScript}`,
            );
          } finally {
            // Restore the original implementation, otherwise it will affect other tests
            spy.mockRestore();
          }
        });

        describe("P2PKH", () => {
          it("returns nonWitnessUtxo when rawTxHex is provided", () => {
            const { publicKey } = dataGenerator.generateRandomKeyPair();
            const p2pkh = bitcoin.payments.p2pkh({
              pubkey: Buffer.from(publicKey, "hex"),
              network,
            });
            // Must include rawTxHex for legacy inputs
            const utxo = makeUTXO(p2pkh.output!.toString("hex"), {
              rawTxHex: dummyRawTxHex,
            });

            const fields = getPsbtInputFields(utxo);
            expect(fields.nonWitnessUtxo).toEqual(
              Buffer.from(dummyRawTxHex, "hex"),
            );
            // Should not have witnessUtxo, redeemScript, or witnessScript
            expect(fields.witnessUtxo).toBeUndefined();
            expect(fields.redeemScript).toBeUndefined();
            expect(fields.witnessScript).toBeUndefined();
          });

          it("throws an error if rawTxHex is missing for P2PKH", () => {
            const { publicKey } = dataGenerator.generateRandomKeyPair();
            const p2pkh = bitcoin.payments.p2pkh({
              pubkey: Buffer.from(publicKey, "hex"),
              network,
            });
            const utxo = makeUTXO(p2pkh.output!.toString("hex"));
            expect(() => getPsbtInputFields(utxo)).toThrow(
              "Missing rawTxHex for legacy P2PKH input",
            );
          });
        });

        describe("P2SH", () => {
          it("returns nonWitnessUtxo and redeemScript for valid P2SH", () => {
            const { publicKey } = dataGenerator.generateRandomKeyPair();
            const nested = bitcoin.payments.p2wpkh({
              pubkey: Buffer.from(publicKey, "hex"),
              network,
            });
            const p2sh = bitcoin.payments.p2sh({ redeem: nested, network });

            const utxo = makeUTXO(p2sh.output!.toString("hex"), {
              rawTxHex: dummyRawTxHex,
              redeemScript: dummyRedeemScriptHex,
            });
            const fields = getPsbtInputFields(utxo);
            expect(fields.nonWitnessUtxo).toEqual(
              Buffer.from(dummyRawTxHex, "hex"),
            );
            expect(fields.redeemScript).toEqual(
              Buffer.from(dummyRedeemScriptHex, "hex"),
            );
            expect(fields.witnessUtxo).toBeUndefined();
          });

          it("throws if rawTxHex is missing for P2SH", () => {
            const { publicKey } = dataGenerator.generateRandomKeyPair();
            const nested = bitcoin.payments.p2wpkh({
              pubkey: Buffer.from(publicKey, "hex"),
              network,
            });
            const p2sh = bitcoin.payments.p2sh({ redeem: nested, network });

            const utxo = makeUTXO(p2sh.output!.toString("hex"), {
              // No rawTxHex
              redeemScript: dummyRedeemScriptHex,
            });
            expect(() => getPsbtInputFields(utxo)).toThrow(
              "Missing rawTxHex for P2SH input",
            );
          });

          it("throws if redeemScript is missing for P2SH", () => {
            const { publicKey } = dataGenerator.generateRandomKeyPair();
            const nested = bitcoin.payments.p2wpkh({
              pubkey: Buffer.from(publicKey, "hex"),
              network,
            });
            const p2sh = bitcoin.payments.p2sh({ redeem: nested, network });

            const utxo = makeUTXO(p2sh.output!.toString("hex"), {
              rawTxHex: dummyRawTxHex,
              // No redeemScript
            });
            expect(() => getPsbtInputFields(utxo)).toThrow(
              "Missing redeemScript for P2SH input",
            );
          });
        });

        describe("P2WPKH", () => {
          it("returns witnessUtxo only for valid P2WPKH", () => {
            const { publicKey } = dataGenerator.generateRandomKeyPair();
            const p2wpkh = bitcoin.payments.p2wpkh({
              pubkey: Buffer.from(publicKey, "hex"),
              network,
            });
            const utxo = makeUTXO(p2wpkh.output!.toString("hex"));

            const fields = getPsbtInputFields(utxo);
            expect(fields.witnessUtxo).toBeDefined();
            expect(fields.witnessUtxo?.script).toEqual(
              Buffer.from(p2wpkh.output!.toString("hex"), "hex"),
            );
            expect(fields.witnessUtxo?.value).toBe(dummyValue);
            expect(fields.nonWitnessUtxo).toBeUndefined();
            expect(fields.redeemScript).toBeUndefined();
            expect(fields.witnessScript).toBeUndefined();
          });
        });

        describe("P2WSH", () => {
          it("returns witnessUtxo and witnessScript for valid P2WSH with custom script", () => {
            const customScript = bitcoin.script.compile([
              bitcoin.opcodes.OP_RETURN,
              Buffer.from("hello"),
            ]);
            const p2wsh = bitcoin.payments.p2wsh({
              redeem: { output: customScript },
              network,
            });

            const utxo = makeUTXO(p2wsh.output!.toString("hex"), {
              witnessScript: customScript.toString("hex"),
            });

            const fields = getPsbtInputFields(utxo);
            expect(fields.witnessUtxo).toEqual({
              script: Buffer.from(p2wsh.output!.toString("hex"), "hex"),
              value: dummyValue,
            });
            expect(fields.witnessScript).toEqual(
              Buffer.from(customScript.toString("hex"), "hex"),
            );
            expect(fields.nonWitnessUtxo).toBeUndefined();
            expect(fields.redeemScript).toBeUndefined();
          });

          it("throws if witnessScript is missing for P2WSH", () => {
            const customScript = bitcoin.script.compile([
              bitcoin.opcodes.OP_RETURN,
              Buffer.from("hello"),
            ]);
            const p2wsh = bitcoin.payments.p2wsh({
              redeem: { output: customScript },
              network,
            });
            const utxo = makeUTXO(p2wsh.output!.toString("hex")); // no witnessScript

            expect(() => getPsbtInputFields(utxo)).toThrow(
              "Missing witnessScript for P2WSH input",
            );
          });
        });

        describe("P2TR (Taproot)", () => {
          it("returns witnessUtxo only if no publicKeyNoCoord is passed", () => {
            const kp = dataGenerator.generateRandomKeyPair();
            const noCoord = Buffer.from(kp.publicKeyNoCoord, "hex");
            const p2tr = bitcoin.payments.p2tr({
              internalPubkey: noCoord,
              network,
            });
            const utxo = makeUTXO(p2tr.output!.toString("hex"));

            const fields = getPsbtInputFields(utxo);
            expect(fields.witnessUtxo).toBeDefined();
            expect(fields.tapInternalKey).toBeUndefined();
          });

          it("returns tapInternalKey if publicKeyNoCoord is passed", () => {
            const kp = dataGenerator.generateRandomKeyPair();
            const noCoord = Buffer.from(kp.publicKeyNoCoord, "hex");
            const p2tr = bitcoin.payments.p2tr({
              internalPubkey: noCoord,
              network,
            });
            const utxo = makeUTXO(p2tr.output!.toString("hex"));

            const fields = getPsbtInputFields(utxo, noCoord);
            expect(fields.witnessUtxo).toBeDefined();
            expect(fields.tapInternalKey).toEqual(noCoord);
          });
        });
      },
    );
  },
);
