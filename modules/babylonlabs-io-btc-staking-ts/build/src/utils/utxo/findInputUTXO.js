"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findInputUTXO = void 0;
const btc_1 = require("../btc");
const findInputUTXO = (inputUTXOs, input) => {
    const inputUTXO = inputUTXOs.find((u) => (0, btc_1.transactionIdToHash)(u.txid).toString("hex") ===
        input.hash.toString("hex") && u.vout === input.index);
    if (!inputUTXO) {
        throw new Error(`Input UTXO not found for txid: ${Buffer.from(input.hash).reverse().toString("hex")} ` +
            `and vout: ${input.index}`);
    }
    return inputUTXO;
};
exports.findInputUTXO = findInputUTXO;
