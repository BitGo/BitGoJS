import 'should';
import { ConfidentialTransferBuilder, KeyPair, Transaction } from '../../../src';
import * as testData from '../../resources/sol';
import { TOKEN_2022_PROGRAM_ID, TokenInstruction } from '@solana/spl-token';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Solana Confidential Transfer Builder - CT account enablement (v1)', () => {
  const factory = getBuilderFactory('sol');
  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  const mintAddress = testData.associatedTokenAccountsForSol2022.mintId;
  const tokenAddress = testData.associatedTokenAccountsForSol2022.accounts[0].ata;
  const authorityAddress = account.pub;

  const zeroBytes36 = '00'.repeat(36);
  const proofDataHex = '00'.repeat(320);

  const v1Config = {
    computeUnitLimit: 200_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
  };

  const ctEnablementBuilder = () => {
    const txBuilder = factory.getConfidentialTransferBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    txBuilder.sign({ key: account.prv });
    return txBuilder;
  };

  const addEnablementInstructions = (builder: ConfidentialTransferBuilder) => {
    builder
      .createAta({
        mintAddress,
        ataAddress: tokenAddress,
        ownerAddress: authorityAddress,
        payerAddress: account.pub,
        tokenName: 'tsol:ray',
        // CT mints are Token-2022 — the ATA must be created under the Token-2022 program
        programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
      })
      .configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        elgamalPubkey: '11'.repeat(32),
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '18446744073709551615',
        proofInstructionOffset: 1,
      })
      .verifyPubkeyValidity({ proofData: proofDataHex });
  };

  it('should build a v1 CT enablement transaction (CreateATA + ConfigureAccount + VerifyPubkeyValidity)', async function () {
    const builder = ctEnablementBuilder();
    addEnablementInstructions(builder);
    builder.version(1).transactionConfig(v1Config);

    const tx = await builder.build();

    (tx as Transaction).isVersionedTransaction().should.equal(true);

    const rawTx = tx.toBroadcastFormat();
    const wire = Buffer.from(rawTx, 'base64');

    // v1 version byte prefix
    wire[0].should.equal(0x81);
    // within the v1 wire size limit
    wire.length.should.be.lessThanOrEqual(4096);

    // metadata transaction carries all four instructions in order:
    // CreateATA -> Reallocate (ConfidentialTransferAccount) -> ConfigureAccount -> Verify
    const solTx = (tx as Transaction).solTransaction!;
    solTx.instructions.length.should.equal(4);
    solTx.instructions[0].data[0].should.equal(1 /* ATA program CreateIdempotent discriminator */);
    solTx.instructions[1].programId.toString().should.equal(TOKEN_2022_PROGRAM_ID.toString());
    solTx.instructions[1].data[0].should.equal(TokenInstruction.Reallocate);
    solTx.instructions[2].programId.toString().should.equal(TOKEN_2022_PROGRAM_ID.toString());
  });

  it('should keep instruction order stable (no ApplyPendingBalance reordering concern)', async function () {
    const builder = ctEnablementBuilder();
    addEnablementInstructions(builder);
    builder.version(1).transactionConfig(v1Config);

    const tx = await builder.build();
    const json = (tx as Transaction).toJson();
    json.instructionsData.length.should.equal(4);
    json.instructionsData[0].type.should.equal('CreateAssociatedTokenAccount');
    // Reallocate is a Token-2022 extension instruction, surfaced as a custom instruction
    json.instructionsData[1].type.should.equal('ReallocateConfidentialTransferAccount');
    json.instructionsData[2].type.should.equal('ConfigureConfidentialTransferAccount');
  });

  it('should require at least one CT/ATA instruction', async function () {
    const builder = ctEnablementBuilder();
    builder.version(1).transactionConfig(v1Config);
    await builder.build().should.be.rejectedWith(/At least one confidential transfer instruction/);
  });
});
