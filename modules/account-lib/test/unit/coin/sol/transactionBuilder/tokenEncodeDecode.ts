import { KeyPair } from '../../../../../src/coin/sol';
import * as testData from '../../../../resources/sol/sol';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  DecodedTransferCheckedInstructionUnchecked,
  decodeTransferCheckedInstruction,
  TokenInstruction,
} from '../../../../../src/coin/sol/tokenEncodeDecode';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

describe('Token Encode Decode Methods', () => {
  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();

  const amount = testData.tokenTransfers.amount;
  const mint = new PublicKey(testData.tokenTransfers.mintUSDC);
  const source = new PublicKey(testData.tokenTransfers.sourceUSDC);
  const decimals = testData.tokenTransfers.decimals;
  const owner = new PublicKey(authAccount.pub);
  const destination = new PublicKey(nonceAccount.pub);
  const expectedDecoded: DecodedTransferCheckedInstructionUnchecked = {
    programId: TOKEN_PROGRAM_ID,
    keys: {
      source: { pubkey: source, isSigner: false, isWritable: true },
      mint: { pubkey: mint, isSigner: false, isWritable: false },
      destination: { pubkey: destination, isSigner: false, isWritable: true },
      owner: { pubkey: owner, isSigner: true, isWritable: false },
      multiSigners: [],
    },
    data: {
      instruction: TokenInstruction.TransferChecked,
      amount: amount,
      decimals: decimals,
    },
  };
  it('decoding works as expected', async () => {
    const instruction = Token.createTransferCheckedInstruction(
      TOKEN_PROGRAM_ID,
      source,
      mint,
      destination,
      owner,
      [],
      amount,
      decimals,
    );
    const decoded = decodeTransferCheckedInstruction(instruction);
    decoded.should.deepEqual(expectedDecoded);
  });
  describe('Fail', () => {
    it('for incorrect program id', () => {
      const instruction = Token.createTransferCheckedInstruction(
        SystemProgram.programId,
        source,
        mint,
        destination,
        owner,
        [],
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
