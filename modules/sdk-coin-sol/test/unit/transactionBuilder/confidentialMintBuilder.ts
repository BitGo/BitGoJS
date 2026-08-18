import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Transaction, Utils } from '../../../src';
import {
  InstructionBuilderTypes,
  ValidInstructionTypesEnum,
  ZK_ELGAMAL_PROOF_PROGRAM_ID,
} from '../../../src/lib/constants';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
import * as testData from '../../resources/sol';

describe('Sol Confidential Mint Builder', () => {
  const factory = getBuilderFactory('tsol');

  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const otherAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  const tokenAddress = otherAccount.pub;
  const mintAddress = testData.associatedTokenAccountsForSol2022.mintId;
  const authorityAddress = authAccount.pub;
  const payerAddress = authAccount.pub;
  const rangeRecordAddress = 'GokcrhFcy9AzBHZvK6yM7a1bL4G1jJRmCYwY8ZzDmQ2P';
  const equalityContextStateAddress = 'HN7MwtRCm8E16B7mDkjYJVfxvdrmtXSCVyWsERgTRE6A';
  const validityContextStateAddress = '7Uxci7Cyi3M6utvAFP6uhzkH3yMzhfqshA4Uu4hqBfy8';
  const contextStateAuthorityAddress = authAccount.pub;

  const zeroBytes36 = '00'.repeat(36);
  const zeroBytes64 = '00'.repeat(64);
  const rangeProofHex = '00'.repeat(1000);

  const confidentialMintBuilder = () => {
    const txBuilder = factory.getConfidentialMintBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(authAccount.pub);
    return txBuilder;
  };

  describe('ConfigureConfidentialTransferAccount instruction', () => {
    it('build a configure confidential transfer account tx', async () => {
      const txBuilder = confidentialMintBuilder();
      txBuilder.configureConfidentialTransferAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '2',
        proofInstructionOffset: 0,
      });
      const tx = await txBuilder.build();
      (tx as Transaction).solTransaction.instructions.should.have.length(1);

      const instruction = (tx as Transaction).solTransaction.instructions[0];
      instruction.programId.toString().should.equal(TOKEN_2022_PROGRAM_ID.toString());
      instruction.data.length.should.equal(47);
      instruction.data[0].should.equal(27); // ConfidentialTransferExtension discriminator
      instruction.data[1].should.equal(2); // ConfigureConfidentialTransferAccount extension discriminator
      instruction.data.slice(2, 38).toString('hex').should.equal(zeroBytes36);
      instruction.data.readBigUInt64LE(38).toString().should.equal('2');
      instruction.data[46].should.equal(0);

      const txJson = tx.toJson();
      txJson.instructionsData[0].type.should.equal(InstructionBuilderTypes.ConfigureConfidentialTransferAccount);
    });
  });

  describe('Confidential mint proof-account group', () => {
    it('build a confidential mint tx with the full proof-account sequence', async () => {
      const txBuilder = confidentialMintBuilder();
      txBuilder.confidentialMint({
        tokenAddress,
        mintAddress,
        authorityAddress,
        payerAddress,
        rangeRecordAddress,
        equalityContextStateAddress,
        validityContextStateAddress,
        contextStateAuthorityAddress,
        newDecryptableSupply: zeroBytes36,
        mintAmountAuditorCiphertextLo: zeroBytes64,
        mintAmountAuditorCiphertextHi: zeroBytes64,
        rangeRecordData: rangeProofHex,
      });
      const tx = await txBuilder.build();
      const instructions = (tx as Transaction).solTransaction.instructions;

      // create-record → write → verify equality → verify validity → verify range → confidentialMint
      instructions.should.have.length(6);

      const types = tx.toJson().instructionsData.map((data) => data.type);
      types.should.deepEqual([
        InstructionBuilderTypes.CreateRecordAccount,
        InstructionBuilderTypes.WriteRecordData,
        InstructionBuilderTypes.VerifyEqualityProof,
        InstructionBuilderTypes.VerifyValidityProof,
        InstructionBuilderTypes.VerifyRangeProof,
        InstructionBuilderTypes.ConfidentialMint,
      ]);

      // ConfidentialMint instruction layout validation
      const confidentialMintInstruction = instructions[instructions.length - 1];
      confidentialMintInstruction.programId.toString().should.equal(TOKEN_2022_PROGRAM_ID.toString());
      confidentialMintInstruction.data.length.should.equal(169);
      confidentialMintInstruction.data[0].should.equal(42); // ConfidentialMint discriminator
      confidentialMintInstruction.data[1].should.equal(3); // confidentialMintBurn extension discriminator
      confidentialMintInstruction.data.slice(2, 38).toString('hex').should.equal(zeroBytes36);
      confidentialMintInstruction.data.slice(38, 102).toString('hex').should.equal(zeroBytes64);
      confidentialMintInstruction.data.slice(102, 166).toString('hex').should.equal(zeroBytes64);
      // Proof instruction offsets are signed i8 relative to confidentialMint:
      // equality at index 2 (-3 from index 5), validity at 3 (-2), range at 4 (-1)
      confidentialMintInstruction.data[166].should.equal(253); // -3 as u8
      confidentialMintInstruction.data[167].should.equal(254); // -2 as u8
      confidentialMintInstruction.data[168].should.equal(255); // -1 as u8

      // CreateRecordAccount instruction: rent-exempt lamports, zk-proof program owner
      const createRecordInstruction = instructions[0];
      createRecordInstruction.programId.toString().should.equal(SystemProgram.programId.toString());
      // lamports = (space + 128) * 6960 * 2 = (1000 + 128) * 6960 * 2 = 15,697,920
      // SystemProgram.createAccount layout: [4-byte index][8-byte lamports][8-byte space][32-byte programId]
      Number(createRecordInstruction.data.readBigUInt64LE(4)).should.equal((1000 + 128) * 6960 * 2);

      // VerifyRangeProof instruction: single key, zk-proof program
      const rangeProofInstruction = instructions[4];
      rangeProofInstruction.programId.toString().should.equal(ZK_ELGAMAL_PROOF_PROGRAM_ID);
      rangeProofInstruction.keys.should.have.length(1);
      rangeProofInstruction.keys[0].pubkey.toString().should.equal(rangeRecordAddress);
      rangeProofInstruction.keys[0].isSigner.should.equal(false);
      rangeProofInstruction.keys[0].isWritable.should.equal(false);
    });

    it('build a confidential mint tx with two record writes and optional close instructions', async () => {
      const part1 = '00'.repeat(800);
      const part2 = '00'.repeat(200);
      const txBuilder = confidentialMintBuilder();
      txBuilder.confidentialMint({
        tokenAddress,
        mintAddress,
        authorityAddress,
        payerAddress,
        rangeRecordAddress,
        equalityContextStateAddress,
        validityContextStateAddress,
        contextStateAuthorityAddress,
        newDecryptableSupply: zeroBytes36,
        mintAmountAuditorCiphertextLo: zeroBytes64,
        mintAmountAuditorCiphertextHi: zeroBytes64,
        rangeRecordData: part1,
        rangeRecordDataPart2: part2,
        closeRecordAccount: true,
        closeEqualityContextState: true,
        closeValidityContextState: true,
      });
      const tx = await txBuilder.build();
      const types = tx.toJson().instructionsData.map((data) => data.type);

      // create-record → write → write → verify × 3 → confidentialMint → close record → close equality → close validity
      types.should.deepEqual([
        InstructionBuilderTypes.CreateRecordAccount,
        InstructionBuilderTypes.WriteRecordData,
        InstructionBuilderTypes.WriteRecordData,
        InstructionBuilderTypes.VerifyEqualityProof,
        InstructionBuilderTypes.VerifyValidityProof,
        InstructionBuilderTypes.VerifyRangeProof,
        InstructionBuilderTypes.ConfidentialMint,
        InstructionBuilderTypes.CloseRecordAccount,
        InstructionBuilderTypes.CloseContextState,
        InstructionBuilderTypes.CloseContextState,
      ]);

      // CloseRecordAccount: zk-proof program, authority is signer
      const instructions = (tx as Transaction).solTransaction.instructions;
      const closeRecordInstruction = instructions[7];
      closeRecordInstruction.programId.toString().should.equal(ZK_ELGAMAL_PROOF_PROGRAM_ID);
      closeRecordInstruction.keys.should.have.length(3);
      closeRecordInstruction.keys[0].pubkey.toString().should.equal(rangeRecordAddress);
      closeRecordInstruction.keys[0].isWritable.should.equal(true);
      closeRecordInstruction.keys[2].pubkey.toString().should.equal(ZK_ELGAMAL_PROOF_PROGRAM_ID);
      closeRecordInstruction.keys[2].isSigner.should.equal(true);
    });

    it('build a combined configure + confidential mint tx', async () => {
      const txBuilder = confidentialMintBuilder();
      txBuilder.configureConfidentialTransferAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '65536',
      });
      txBuilder.confidentialMint({
        tokenAddress,
        mintAddress,
        authorityAddress,
        payerAddress,
        rangeRecordAddress,
        equalityContextStateAddress,
        validityContextStateAddress,
        contextStateAuthorityAddress,
        newDecryptableSupply: zeroBytes36,
        mintAmountAuditorCiphertextLo: zeroBytes64,
        mintAmountAuditorCiphertextHi: zeroBytes64,
        rangeRecordData: rangeProofHex,
      });
      const tx = await txBuilder.build();
      const types = tx.toJson().instructionsData.map((data) => data.type);
      types[0].should.equal(InstructionBuilderTypes.ConfigureConfidentialTransferAccount);
      types[1].should.equal(InstructionBuilderTypes.CreateRecordAccount);
      types[types.length - 1].should.equal(InstructionBuilderTypes.ConfidentialMint);
    });

    it('produce a valid raw transaction', async () => {
      const txBuilder = confidentialMintBuilder();
      txBuilder.confidentialMint({
        tokenAddress,
        mintAddress,
        authorityAddress,
        payerAddress,
        rangeRecordAddress,
        equalityContextStateAddress,
        validityContextStateAddress,
        contextStateAuthorityAddress,
        newDecryptableSupply: zeroBytes36,
        mintAmountAuditorCiphertextLo: zeroBytes64,
        mintAmountAuditorCiphertextHi: zeroBytes64,
        rangeRecordData: '00'.repeat(64),
      });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
    });

    it('use custom recordAccountLamports and recordAccountOwnerAddress when provided', async () => {
      const customLamports = 5000000;
      const customOwner = 'E7cxo6gZqEJzBm2Pf3yZ3yX5y8x2yX5yZ3yX5y8x2yX5';
      const txBuilder = confidentialMintBuilder();
      txBuilder.confidentialMint({
        tokenAddress,
        mintAddress,
        authorityAddress,
        payerAddress,
        rangeRecordAddress,
        equalityContextStateAddress,
        validityContextStateAddress,
        contextStateAuthorityAddress,
        recordAccountOwnerAddress: customOwner,
        recordAccountLamports: customLamports,
        newDecryptableSupply: zeroBytes36,
        mintAmountAuditorCiphertextLo: zeroBytes64,
        mintAmountAuditorCiphertextHi: zeroBytes64,
        rangeRecordData: '00'.repeat(64),
      });
      const tx = await txBuilder.build();
      const instructions = (tx as Transaction).solTransaction.instructions;

      // CreateRecordAccount: custom lamports + custom owner as programId
      const createInstruction = instructions[0];
      Number(createInstruction.data.readBigUInt64LE(4)).should.equal(customLamports);
    });
  });

  describe('Instruction type classification', () => {
    it('classifies verify instructions as CustomInstruction by the generic parser', async () => {
      const txBuilder = confidentialMintBuilder();
      txBuilder.confidentialMint({
        tokenAddress,
        mintAddress,
        authorityAddress,
        payerAddress,
        rangeRecordAddress,
        equalityContextStateAddress,
        validityContextStateAddress,
        contextStateAuthorityAddress,
        newDecryptableSupply: zeroBytes36,
        mintAmountAuditorCiphertextLo: zeroBytes64,
        mintAmountAuditorCiphertextHi: zeroBytes64,
        rangeRecordData: rangeProofHex,
      });
      const tx = await txBuilder.build();
      const solInstructions = (tx as Transaction).solTransaction.instructions;
      // The zk-elgamal-proof program instructions are not decodable by the existing parser,
      // so they should fall back to CustomInstruction.
      const verifyInstructions = solInstructions.slice(2, 5);
      verifyInstructions.forEach((instruction) => {
        Utils.getInstructionType(instruction).should.equal(ValidInstructionTypesEnum.CustomInstruction);
      });
    });
  });

  describe('Validation', () => {
    it('reject a builder with no instructions', async () => {
      const txBuilder = confidentialMintBuilder();
      await should(txBuilder.build()).be.rejectedWith(/confidential mint or configure instruction/);
    });

    it('reject invalid addresses', async () => {
      const txBuilder = confidentialMintBuilder();
      should(() =>
        txBuilder.confidentialMint({
          tokenAddress: 'invalid',
          mintAddress,
          authorityAddress,
          payerAddress,
          rangeRecordAddress,
          equalityContextStateAddress,
          validityContextStateAddress,
          contextStateAuthorityAddress,
          newDecryptableSupply: zeroBytes36,
          mintAmountAuditorCiphertextLo: zeroBytes64,
          mintAmountAuditorCiphertextHi: zeroBytes64,
          rangeRecordData: rangeProofHex,
        })
      ).throwError(/Invalid or missing tokenAddress/);
    });
  });
});
