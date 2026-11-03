import 'should';
import { KeyPair, Transaction } from '../../../src';
import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Solana Confidential Transfer Builder - v1 per-op', () => {
  const factory = getBuilderFactory('sol');
  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  const mintAddress = testData.associatedTokenAccountsForSol2022.mintId;
  const tokenAddress = testData.associatedTokenAccountsForSol2022.accounts[0].ata;
  const destinationTokenAddress = 'ENn8a2tGMS9bR5XV7smGHJvNgzkyxJmnD2eUvQxY5jSP';
  const authorityAddress = account.pub;

  const zeroBytes36 = '00'.repeat(36);
  const zeroBytes64 = '00'.repeat(64);
  const proofDataHex = '00'.repeat(320);

  const v1Config = {
    computeUnitLimit: 200_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
  };

  const ctBuilder = () => {
    const b = factory.getConfidentialTransferBuilder();
    b.nonce(recentBlockHash).sender(account.pub).sign({ key: account.prv });
    return b;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toV1 = (b: any) => b.version(1).transactionConfig(v1Config);

  const assertV1 = (tx: Transaction) => {
    const wire = Buffer.from((tx as Transaction).toBroadcastFormat(), 'base64');
    wire[0].should.equal(0x81);
    wire.length.should.be.lessThanOrEqual(4096);
    (tx as Transaction).v1MessageBytes!.should.be.an.instanceOf(Uint8Array);
  };

  it('should build a Deposit as a valid v1 transaction', async () => {
    const b = ctBuilder();
    b.confidentialDeposit({ tokenAddress, mintAddress, authorityAddress, amount: '1000000', decimals: 6 });
    const tx = await toV1(b).build();
    assertV1(tx);
  });

  it('should build a Withdraw (with equality + range proofs) as a valid v1 transaction', async () => {
    const b = ctBuilder();
    b.confidentialWithdraw({
      tokenAddress,
      mintAddress,
      authorityAddress,
      amount: '500000',
      decimals: 6,
      newDecryptableAvailableBalance: zeroBytes36,
      equalityProofInstructionOffset: 1,
      rangeProofInstructionOffset: 2,
    })
      .verifyEqualityProof({ proofData: proofDataHex })
      .verifyRangeProof({ proofData: '00'.repeat(1000) });
    const tx = await toV1(b).build();
    assertV1(tx);
  });

  it('should force ApplyPendingBalance to instruction #1 even when added last', async () => {
    const b = ctBuilder();
    // Deliberately add Deposit first, then ApplyPendingBalance out of order.
    b.confidentialDeposit({
      tokenAddress,
      mintAddress,
      authorityAddress,
      amount: '1000000',
      decimals: 6,
    }).applyPendingBalance({
      tokenAddress,
      authorityAddress,
      expectedPendingBalanceCreditCounter: '2',
      newDecryptableAvailableBalance: zeroBytes36,
    });
    const tx = await toV1(b).build();
    assertV1(tx);
    const instructions = tx.toJson().instructionsData;
    instructions.should.have.length(2);
    instructions[0].type.should.equal('ApplyPendingBalance');
    instructions[1].type.should.equal('ConfidentialDeposit');
  });

  it('should build a private Transfer with all proofs as a valid v1 transaction', async () => {
    const b = ctBuilder();
    b.applyPendingBalance({
      tokenAddress,
      authorityAddress,
      expectedPendingBalanceCreditCounter: '2',
      newDecryptableAvailableBalance: zeroBytes36,
    })
      .verifyEqualityProof({ proofData: proofDataHex })
      .verifyValidityProof({ proofData: proofDataHex })
      .verifyRangeProof({ proofData: '00'.repeat(1000) })
      .confidentialTransfer({
        sourceTokenAddress: tokenAddress,
        mintAddress,
        destinationTokenAddress,
        authorityAddress,
        newSourceDecryptableAvailableBalance: zeroBytes36,
        transferAmountAuditorCiphertextLo: zeroBytes64,
        transferAmountAuditorCiphertextHi: zeroBytes64,
        equalityProofInstructionOffset: 1,
        ciphertextValidityProofInstructionOffset: 2,
        rangeProofInstructionOffset: 3,
      });
    const tx = await toV1(b).build();
    assertV1(tx);
    const instructions = tx.toJson().instructionsData;
    instructions[0].type.should.equal('ApplyPendingBalance');
    instructions[4].type.should.equal('ConfidentialTransfer');
  });

  it('should build ConfigureAccount + VerifyPubkeyValidity as a valid v1 transaction', async () => {
    const b = ctBuilder();
    b.configureAccount({
      tokenAddress,
      mintAddress,
      authorityAddress,
      decryptableZeroBalance: zeroBytes36,
      maximumPendingBalanceCreditCounter: '65536',
      proofInstructionOffset: 1,
    }).verifyPubkeyValidity({ proofData: proofDataHex });
    const tx = await toV1(b).build();
    assertV1(tx);
  });

  it('should build each verify-proof instruction through v1', async () => {
    const b = ctBuilder();
    b.verifyEqualityProof({ proofData: proofDataHex })
      .verifyValidityProof({ proofData: proofDataHex })
      .verifyRangeProof({ proofData: '00'.repeat(1000) })
      .verifyPubkeyValidity({ proofData: proofDataHex });
    const tx = await toV1(b).build();
    assertV1(tx);
  });
});
