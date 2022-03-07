import { KeyPair } from '../../../../../src/coin/sol';
import * as testData from '../../../../resources/sol/sol';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  DecodedTransferCheckedInstructionUnchecked,
  decodeTransferCheckedInstruction,
  TokenInstruction,
} from '../../../../../src/coin/sol/tokenEncodeDecode';
const splToken = require('@solana/spl-token');

describe('Token Encode Decode Methods', () => {
  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();

  const amount = testData.tokenTransfers.amount;
  const mint = new PublicKey(testData.tokenTransfers.mint);
  const source = new PublicKey(testData.tokenTransfers.source);
  const multiSigners = testData.tokenTransfers.multiSigners;
  const decimals = testData.tokenTransfers.decimals;
  const owner = new PublicKey(authAccount.pub);
  const destination = new PublicKey(nonceAccount.pub);
  const expectedDecoded: DecodedTransferCheckedInstructionUnchecked = {
    programId: splToken.TOKEN_PROGRAM_ID,
    keys: {
      source: { pubkey: source, isSigner: false, isWritable: true },
      mint: { pubkey: mint, isSigner: false, isWritable: false },
      destination: { pubkey: destination, isSigner: false, isWritable: true },
      owner: { pubkey: owner, isSigner: false, isWritable: false },
      multiSigners: [
        { pubkey: testData.tokenTransfers.multiSigners[0].publicKey, isSigner: true, isWritable: false },
        { pubkey: testData.tokenTransfers.multiSigners[1].publicKey, isSigner: true, isWritable: false },
      ],
    },
    data: {
      instruction: TokenInstruction.TransferChecked,
      amount: amount,
      decimals: decimals,
    },
  };
  it('decoding works as expected', async () => {
    const instruction = splToken.Token.createTransferCheckedInstruction(
      splToken.TOKEN_PROGRAM_ID,
      source,
      mint,
      destination,
      owner,
      multiSigners,
      amount,
      decimals,
    );
    const decoded = decodeTransferCheckedInstruction(instruction);
    decoded.should.deepEqual(expectedDecoded);
  });
  describe('Fail', () => {
    it('for incorrect program id', () => {
      const instruction = splToken.Token.createTransferCheckedInstruction(
        SystemProgram.programId,
        source,
        mint,
        destination,
        owner,
        multiSigners,
        amount,
        decimals,
      );
      let failed = false;
      try {
        decodeTransferCheckedInstruction(instruction);
      } catch (e) {
        failed = true;
      }
      failed.should.equal(true);
    });
  });
});
