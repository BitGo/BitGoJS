import should from 'should';
import * as testData from '../resources/sol';
import { solInstructionFactory } from '../../src/lib/solInstructionFactory';
import {
  InstructionBuilderTypes,
  MEMO_PROGRAM_PK,
  THAW_PERMISSIONLESS_IDEMPOTENT_DISCRIMINATOR,
  TOKEN_ACL_PROGRAM_ID,
} from '../../src/lib/constants';
import { ExtraAccountMeta, InstructionParams } from '../../src/lib/iface';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  createMintToInstruction,
  createBurnInstruction,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedWithFeeInstruction,
} from '@solana/spl-token';
import BigNumber from 'bignumber.js';
import { isIdempotentAtaInstruction } from '../../src/lib/utils';

describe('Instruction Builder Tests: ', function () {
  describe('Succeed ', function () {
    it('Memo', () => {
      const memo = 'test memo';
      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const result = solInstructionFactory(memoParams);
      should.deepEqual(result, [
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey(MEMO_PROGRAM_PK),
          data: Buffer.from(memo),
        }),
      ]);
    });

    it('Close ATA uses Token-2022 program when specified', () => {
      const result = solInstructionFactory({
        type: InstructionBuilderTypes.CloseAssociatedTokenAccount,
        params: {
          accountAddress: testData.authAccount.pub,
          destinationAddress: testData.authAccount2.pub,
          authorityAddress: testData.authAccount.pub,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      });

      result[0].programId.equals(TOKEN_2022_PROGRAM_ID).should.be.true();
    });

    it('Transfer', () => {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const amount = '100000';
      const transferParams: InstructionParams = {
        type: InstructionBuilderTypes.Transfer,
        params: { fromAddress, toAddress, amount },
      };

      const result = solInstructionFactory(transferParams);
      should.deepEqual(result, [
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromAddress),
          toPubkey: new PublicKey(toAddress),
          lamports: new BigNumber(amount).toNumber(),
        }),
      ]);
    });

    it('Advance nonce', () => {
      const authWalletAddress = testData.authAccount.pub;
      const walletNonceAddress = testData.nonceAccount.pub;
      const nonceAdvanceParams: InstructionParams = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress, authWalletAddress },
      };

      const result = solInstructionFactory(nonceAdvanceParams);
      should.deepEqual(result, [
        SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(walletNonceAddress),
          authorizedPubkey: new PublicKey(authWalletAddress),
        }),
      ]);
    });

    it('Create and Nonce initialize', () => {
      const fromAddress = testData.authAccount.pub;
      const nonceAddress = testData.nonceAccount.pub;
      const authAddress = testData.authAccount.pub;
      const amount = '100000';
      const createNonceAccountParams: InstructionParams = {
        type: InstructionBuilderTypes.CreateNonceAccount,
        params: { fromAddress, nonceAddress, authAddress, amount },
      };

      const result = solInstructionFactory(createNonceAccountParams);
      should.deepEqual(
        result,
        SystemProgram.createNonceAccount({
          fromPubkey: new PublicKey(fromAddress),
          noncePubkey: new PublicKey(nonceAddress),
          authorizedPubkey: new PublicKey(authAddress),
          lamports: new BigNumber(amount).toNumber(),
        }).instructions
      );
    });

    it('Create associated token account', () => {
      const mintAddress = testData.associatedTokenAccounts.mintId;
      const ataAddress = testData.associatedTokenAccounts.accounts[0].ata;
      const ownerAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const payerAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const createATAParams: InstructionParams = {
        type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
        params: {
          mintAddress,
          ataAddress,
          ownerAddress,
          payerAddress,
          tokenName: testData.associatedTokenAccounts.mint,
        },
      };

      const result = solInstructionFactory(createATAParams);
      const expected = createAssociatedTokenAccountIdempotentInstruction(
        new PublicKey(payerAddress),
        new PublicKey(ataAddress),
        new PublicKey(ownerAddress),
        new PublicKey(mintAddress)
      );
      should.deepEqual(result, [expected]);
      isIdempotentAtaInstruction(result[0]).should.equal(true);
    });

    it('Create associated token account for Token-2022', () => {
      const mintAddress = testData.associatedTokenAccounts.mintId;
      const ataAddress = testData.associatedTokenAccounts.accounts[0].ata;
      const ownerAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const payerAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const createATAParams: InstructionParams = {
        type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
        params: {
          mintAddress,
          ataAddress,
          ownerAddress,
          payerAddress,
          tokenName: testData.associatedTokenAccounts.mint,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = solInstructionFactory(createATAParams);
      const expected = createAssociatedTokenAccountIdempotentInstruction(
        new PublicKey(payerAddress),
        new PublicKey(ataAddress),
        new PublicKey(ownerAddress),
        new PublicKey(mintAddress),
        TOKEN_2022_PROGRAM_ID
      );
      should.deepEqual(result, [expected]);
      isIdempotentAtaInstruction(result[0]).should.equal(true);
    });

    it('Token Transfer', () => {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const amount = '100000';
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const sourceAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const coinName = testData.tokenTransfers.nameUSDC;

      const transferParams: InstructionParams = {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress: fromAddress,
          toAddress: toAddress,
          amount: amount,
          tokenName: coinName,
          sourceAddress: sourceAddress,
        },
      };

      const result = solInstructionFactory(transferParams);
      should.deepEqual(result, [
        createTransferCheckedInstruction(
          new PublicKey(sourceAddress),
          new PublicKey(mintAddress),
          new PublicKey(toAddress),
          new PublicKey(fromAddress),
          BigInt(amount),
          9
        ),
      ]);
    });

    it('Token Transfer - Token-2022 without transfer hook accounts is plain transferChecked', () => {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const sourceAddress = testData.associatedTokenAccounts.accounts[0].ata;
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const amount = '500000';

      const transferParams: InstructionParams = {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress,
          toAddress,
          amount,
          tokenName: testData.sol2022TokenTransfers.name,
          sourceAddress,
          tokenAddress: mintAddress,
          decimalPlaces: 6,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = solInstructionFactory(transferParams);
      should.deepEqual(result, [
        createTransferCheckedInstruction(
          new PublicKey(sourceAddress),
          new PublicKey(mintAddress),
          new PublicKey(toAddress),
          new PublicKey(fromAddress),
          BigInt(amount),
          6,
          [],
          TOKEN_2022_PROGRAM_ID
        ),
      ]);
    });

    it('Token Transfer - Token-2022 with resolved transfer hook accounts', () => {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const sourceAddress = testData.associatedTokenAccounts.accounts[0].ata;
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const amount = '500000';

      const transferHookAccounts: ExtraAccountMeta[] = [
        {
          pubkey: '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ',
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A',
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm',
          isSigner: false,
          isWritable: false,
        },
      ];

      const transferParams: InstructionParams = {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress,
          toAddress,
          amount,
          tokenName: testData.sol2022TokenTransfers.name,
          sourceAddress,
          tokenAddress: mintAddress,
          decimalPlaces: 6,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
          transferHookAccounts,
        },
      };

      const result = solInstructionFactory(transferParams);
      result.should.have.length(1);

      const builtInstruction = result[0];
      builtInstruction.programId.equals(TOKEN_2022_PROGRAM_ID).should.be.true();

      const baseInstruction = createTransferCheckedInstruction(
        new PublicKey(sourceAddress),
        new PublicKey(mintAddress),
        new PublicKey(toAddress),
        new PublicKey(fromAddress),
        BigInt(amount),
        6,
        [],
        TOKEN_2022_PROGRAM_ID
      );

      const baseKeyCount = baseInstruction.keys.length;
      builtInstruction.keys.slice(0, baseKeyCount).should.deepEqual(baseInstruction.keys);

      // Extra accounts are appended in the exact order supplied.
      const extraKeys = builtInstruction.keys.slice(baseKeyCount);
      const expectedExtraKeys = transferHookAccounts.map((meta) => ({
        pubkey: new PublicKey(meta.pubkey),
        isSigner: meta.isSigner,
        isWritable: meta.isWritable,
      }));
      extraKeys.should.deepEqual(expectedExtraKeys);

      for (const expectedMeta of expectedExtraKeys) {
        builtInstruction.keys.filter((meta) => meta.pubkey.equals(expectedMeta.pubkey)).should.have.length(1);
      }
    });

    it('Permissionless Thaw Idempotent - Token ACL with resolved extra accounts', () => {
      const authority = testData.authAccount.pub;
      const mint = testData.sol2022TokenTransfers.mint;
      const tokenAccount = testData.associatedTokenAccounts.accounts[0].ata;
      const tokenAccountOwner = testData.nonceAccount.pub;
      const gatingProgram = 'GbQ8ZiEFzGGTeYoXwtZtcoxwPcMyUcmZDduMVNdUPKpX';
      const flagAccount = '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ';
      const mintConfig = '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A';
      const extraAccounts: ExtraAccountMeta[] = [
        { pubkey: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm', isSigner: false, isWritable: false },
        { pubkey: testData.authAccount.pub, isSigner: false, isWritable: true },
      ];

      const thawParams: InstructionParams = {
        type: InstructionBuilderTypes.PermissionlessThawIdempotent,
        params: {
          authority,
          mint,
          tokenAccount,
          tokenAccountOwner,
          gatingProgram,
          flagAccount,
          mintConfig,
          extraAccounts,
        },
      };

      const result = solInstructionFactory(thawParams);
      result.should.have.length(1);

      const ix = result[0];
      ix.programId.toString().should.equal(TOKEN_ACL_PROGRAM_ID);
      // The instruction data is the single discriminator byte (9).
      ix.data.should.deepEqual(Buffer.from([THAW_PERMISSIONLESS_IDEMPOTENT_DISCRIMINATOR]));
      ix.data.should.have.length(1);

      // The first nine accounts are fixed, in exact order and with exact flags.
      const expectedFixedKeys = [
        { pubkey: new PublicKey(authority), isSigner: true, isWritable: false },
        { pubkey: new PublicKey(mint), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(tokenAccount), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(flagAccount), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(tokenAccountOwner), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(mintConfig), isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey(gatingProgram), isSigner: false, isWritable: false },
      ];
      ix.keys.slice(0, 9).should.deepEqual(expectedFixedKeys);

      // The resolved extra accounts are appended, in the exact order supplied.
      const expectedExtraKeys = extraAccounts.map((meta) => ({
        pubkey: new PublicKey(meta.pubkey),
        isSigner: meta.isSigner,
        isWritable: meta.isWritable,
      }));
      ix.keys.slice(9).should.deepEqual(expectedExtraKeys);
    });

    it('Permissionless Thaw Idempotent - defaults token and system programs', () => {
      const thawParams: InstructionParams = {
        type: InstructionBuilderTypes.PermissionlessThawIdempotent,
        params: {
          authority: testData.authAccount.pub,
          mint: testData.sol2022TokenTransfers.mint,
          tokenAccount: testData.associatedTokenAccounts.accounts[0].ata,
          tokenAccountOwner: testData.nonceAccount.pub,
          gatingProgram: 'GbQ8ZiEFzGGTeYoXwtZtcoxwPcMyUcmZDduMVNdUPKpX',
          flagAccount: '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ',
          mintConfig: '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A',
          extraAccounts: [],
        },
      };

      const defaultsIx = solInstructionFactory(thawParams)[0];
      // No extra accounts => exactly the nine fixed accounts.
      defaultsIx.keys.should.have.length(9);
      defaultsIx.keys[6].pubkey.equals(TOKEN_2022_PROGRAM_ID).should.be.true();
      defaultsIx.keys[7].pubkey.equals(SystemProgram.programId).should.be.true();
    });

    it('Mint To - Standard SPL Token', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const destinationAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '1000000';
      const tokenName = testData.tokenTransfers.nameUSDC;
      const decimalPlaces = testData.tokenTransfers.decimals;

      const mintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
        },
      };

      const result = solInstructionFactory(mintParams);
      should.deepEqual(result, [
        createMintToInstruction(
          new PublicKey(mintAddress),
          new PublicKey(destinationAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });

    it('Mint To - Token-2022 Program', () => {
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const destinationAddress = testData.sol2022TokenTransfers.source;
      const authorityAddress = testData.authAccount.pub;
      const amount = '2000000';
      const tokenName = testData.sol2022TokenTransfers.name;
      const decimalPlaces = testData.sol2022TokenTransfers.decimals;

      const mintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = solInstructionFactory(mintParams);
      should.deepEqual(result, [
        createMintToInstruction(
          new PublicKey(mintAddress),
          new PublicKey(destinationAddress),
          new PublicKey(authorityAddress),
          BigInt(amount),
          undefined,
          TOKEN_2022_PROGRAM_ID
        ),
      ]);
    });

    it('Burn - Standard SPL Token', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const accountAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '500000';
      const tokenName = testData.tokenTransfers.nameUSDC;
      const decimalPlaces = testData.tokenTransfers.decimals;

      const burnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
        },
      };

      const result = solInstructionFactory(burnParams);
      should.deepEqual(result, [
        createBurnInstruction(
          new PublicKey(accountAddress),
          new PublicKey(mintAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });

    it('Burn - Token-2022 Program', () => {
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const accountAddress = testData.sol2022TokenTransfers.source;
      const authorityAddress = testData.authAccount.pub;
      const amount = '750000';
      const tokenName = testData.sol2022TokenTransfers.name;
      const decimalPlaces = testData.sol2022TokenTransfers.decimals;

      const burnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = solInstructionFactory(burnParams);
      should.deepEqual(result, [
        createBurnInstruction(
          new PublicKey(accountAddress),
          new PublicKey(mintAddress),
          new PublicKey(authorityAddress),
          BigInt(amount),
          undefined,
          TOKEN_2022_PROGRAM_ID
        ),
      ]);
    });

    it('Mint To - Without decimal places', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const destinationAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '1000000';
      const tokenName = testData.tokenTransfers.nameUSDC;

      const mintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
        },
      };

      const result = solInstructionFactory(mintParams);
      should.deepEqual(result, [
        createMintToInstruction(
          new PublicKey(mintAddress),
          new PublicKey(destinationAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });

    it('Burn - Without decimal places', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const accountAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '500000';
      const tokenName = testData.tokenTransfers.nameUSDC;

      const burnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
        },
      };

      const result = solInstructionFactory(burnParams);
      should.deepEqual(result, [
        createBurnInstruction(
          new PublicKey(accountAddress),
          new PublicKey(mintAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });

    it('Custom instruction with TSS format', () => {
      const tssInstruction = {
        programId: '11111111111111111111111111111112',
        keys: [
          {
            pubkey: 'CyjoLt3kjqB57K7ewCBHmnHq3UgEj3ak6A7m6EsBsuhA',
            isSigner: true,
            isWritable: true,
          },
        ],
        data: 'dGVzdCBpbnN0cnVjdGlvbiBkYXRh', // "test instruction data" in base64
      };

      const customInstructionParams: InstructionParams = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: {
          ...tssInstruction,
        },
      };

      const result = solInstructionFactory(customInstructionParams);

      result.should.have.length(1);
      const resultInstruction = result[0];

      resultInstruction.programId.toString().should.equal('11111111111111111111111111111112');
      resultInstruction.keys.should.have.length(1);
      resultInstruction.keys[0].pubkey.toString().should.equal('CyjoLt3kjqB57K7ewCBHmnHq3UgEj3ak6A7m6EsBsuhA');
      resultInstruction.keys[0].isSigner.should.equal(true);
      resultInstruction.keys[0].isWritable.should.equal(true);
      resultInstruction.data.toString().should.equal('test instruction data');
    });

    it('Custom instruction with TSS format - hex data', () => {
      const tssInstruction = {
        programId: '11111111111111111111111111111112',
        keys: [
          {
            pubkey: 'CyjoLt3kjqB57K7ewCBHmnHq3UgEj3ak6A7m6EsBsuhA',
            isSigner: false,
            isWritable: false,
          },
        ],
        data: '74657374', // "test" in hex
      };

      const customInstructionParams: InstructionParams = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: {
          ...tssInstruction,
        },
      };

      const result = solInstructionFactory(customInstructionParams);

      result.should.have.length(1);
      const resultInstruction = result[0];

      resultInstruction.programId.toString().should.equal('11111111111111111111111111111112');
      resultInstruction.keys.should.have.length(1);
      resultInstruction.keys[0].pubkey.toString().should.equal('CyjoLt3kjqB57K7ewCBHmnHq3UgEj3ak6A7m6EsBsuhA');
      resultInstruction.keys[0].isSigner.should.equal(false);
      resultInstruction.keys[0].isWritable.should.equal(false);
      // Note: hex data will fall back to base64 then UTF-8, so it should contain the hex string
      resultInstruction.data.should.be.instanceOf(Buffer);
    });

    it('Custom instruction with TSS format - UTF-8 fallback', () => {
      const tssInstruction = {
        programId: '11111111111111111111111111111112',
        keys: [],
        data: 'hello world', // plain text, should use UTF-8 encoding
      };

      const customInstructionParams: InstructionParams = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: {
          ...tssInstruction,
        },
      };

      const result = solInstructionFactory(customInstructionParams);

      result.should.have.length(1);
      const resultInstruction = result[0];

      resultInstruction.programId.toString().should.equal('11111111111111111111111111111112');
      resultInstruction.keys.should.have.length(0);
      // Since "hello world" is not valid base64, it should fall back to UTF-8
      resultInstruction.data.toString('utf8').should.equal('hello world');
    });
  });

  describe('Fail ', function () {
    it('Invalid type', () => {
      // @ts-expect-error Testing for an invalid type, should throw error
      should(() => solInstructionFactory({ type: 'random', params: {} })).throwError(
        'Invalid instruction type or not supported'
      );
    });

    it('Custom instruction - missing programId', () => {
      const customInstructionParams = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: {
          keys: [],
          data: 'test',
        },
      } as unknown as InstructionParams;

      should(() => solInstructionFactory(customInstructionParams)).throwError(
        'Missing programId in custom instruction'
      );
    });

    it('Custom instruction - missing keys', () => {
      const customInstructionParams = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: {
          programId: '11111111111111111111111111111112',
          data: 'test',
        },
      } as unknown as InstructionParams;

      should(() => solInstructionFactory(customInstructionParams)).throwError(
        'Missing or invalid keys in custom instruction'
      );
    });

    it('Custom instruction - missing data', () => {
      const customInstructionParams = {
        type: InstructionBuilderTypes.CustomInstruction,
        params: {
          programId: '11111111111111111111111111111112',
          keys: [
            {
              pubkey: 'CyjoLt3kjqB57K7ewCBHmnHq3UgEj3ak6A7m6EsBsuhA',
              isSigner: true,
              isWritable: true,
            },
          ],
        },
      } as unknown as InstructionParams;

      should(() => solInstructionFactory(customInstructionParams)).throwError('Missing data in custom instruction');
    });
  });

  it('Token Transfer - Token-2022 with transfer fee (transferCheckedWithFee)', () => {
    const t = testData.sol2022TokenTransfers;
    const amount = '1000000';
    const fee = '1000';
    const transferParams: InstructionParams = {
      type: InstructionBuilderTypes.TokenTransfer,
      params: {
        fromAddress: t.owner, // authority
        toAddress: t.owner, // destination
        amount,
        tokenName: t.name,
        sourceAddress: t.source,
        tokenAddress: t.mint,
        decimalPlaces: t.decimals,
        programId: TOKEN_2022_PROGRAM_ID.toString(),
        fee, // explicit fee → transferCheckedWithFee path
      },
    };
    const result = solInstructionFactory(transferParams);
    result.should.have.length(1);
    const built = result[0];
    built.programId.equals(TOKEN_2022_PROGRAM_ID).should.be.true();

    const reference = createTransferCheckedWithFeeInstruction(
      new PublicKey(t.source),
      new PublicKey(t.mint),
      new PublicKey(t.owner),
      new PublicKey(t.owner),
      BigInt(amount),
      t.decimals,
      BigInt(fee),
      [],
      TOKEN_2022_PROGRAM_ID
    );
    built.data.should.deepEqual(reference.data); // discriminator + amount + decimals + fee
  });
});
