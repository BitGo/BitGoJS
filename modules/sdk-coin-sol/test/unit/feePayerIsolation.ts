import should from 'should';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createApproveInstruction,
  createAssociatedTokenAccountInstruction,
  createReallocateInstruction,
  createSetAuthorityInstruction,
  createTransferCheckedInstruction,
  AuthorityType,
  ExtensionType,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Keypair, PublicKey, StakeProgram, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { isFeePayerIsolated } from '../../src/lib/utils';

describe('isFeePayerIsolated', function () {
  const key = () => Keypair.generate().publicKey;
  const feePayer = key();
  const wallet = key();
  const other = key();
  const nonceAccount = key();
  const mint = key();
  const isolated = (instructions: TransactionInstruction[], extraMints: string[] = []) =>
    isFeePayerIsolated(feePayer.toBase58(), instructions, extraMints);
  const ata = (owner: PublicKey, tokenProgram: PublicKey = TOKEN_PROGRAM_ID) =>
    PublicKey.findProgramAddressSync(
      [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
  const advance = (authorizedPubkey: PublicKey) =>
    SystemProgram.nonceAdvance({ noncePubkey: nonceAccount, authorizedPubkey });
  const transfer = (from: PublicKey, to: PublicKey) =>
    SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: 1000 });

  describe('accepted: the fee payer only pays', function () {
    it('accepts the fee payer as the durable-nonce authority', function () {
      should(isolated([advance(feePayer), transfer(wallet, other)])).equal(true);
    });

    it('accepts a transaction that does not reference the fee payer at all', function () {
      should(isolated([transfer(wallet, other)])).equal(true);
    });

    it('accepts the fee payer as the funder of a token-account creation', function () {
      const create = createAssociatedTokenAccountInstruction(feePayer, ata(wallet), wallet, mint);
      should(isolated([advance(feePayer), create])).equal(true);
    });

    it('accepts a token transfer between accounts the fee payer does not own', function () {
      const move = createTransferCheckedInstruction(ata(wallet), mint, ata(other), wallet, 5, 6);
      should(isolated([advance(feePayer), move])).equal(true);
    });

    it('returns true for a transaction with no instruction', function () {
      should(isolated([])).equal(true);
    });
  });

  describe('rejected: the fee payer is more than a payer', function () {
    it('rejects the fee payer as the source or destination of a transfer', function () {
      should(isolated([transfer(feePayer, other)])).equal(false);
      should(isolated([transfer(wallet, feePayer)])).equal(false);
    });

    it('rejects the fee payer as the owner of a token-account creation, even when it also funds it', function () {
      const create = createAssociatedTokenAccountInstruction(feePayer, ata(feePayer), feePayer, mint);
      should(isolated([create])).equal(false);
    });

    it('rejects the fee payer as the nonce account of the advance instruction', function () {
      const advanceOnFeePayer = SystemProgram.nonceAdvance({ noncePubkey: feePayer, authorizedPubkey: wallet });
      should(isolated([advanceOnFeePayer])).equal(false);
    });

    it('rejects the fee payer as the staker or withdrawer of a new stake account (inside the instruction data)', function () {
      const stake = key();
      const initialize = StakeProgram.initialize({
        stakePubkey: stake,
        authorized: { staker: wallet, withdrawer: feePayer },
      });
      should(isolated([initialize])).equal(false);
      const stakerIsFeePayer = StakeProgram.initialize({
        stakePubkey: stake,
        authorized: { staker: feePayer, withdrawer: wallet },
      });
      should(isolated([stakerIsFeePayer])).equal(false);
    });

    it('rejects a stake authority change to the fee payer', function () {
      const authorize = StakeProgram.authorize({
        stakePubkey: key(),
        authorizedPubkey: wallet,
        newAuthorizedPubkey: feePayer,
        stakeAuthorizationType: { index: 1 },
      });
      should(isolated([...authorize.instructions])).equal(false);
    });

    it('rejects an approval of the fee payer as a token delegate', function () {
      const approve = createApproveInstruction(ata(wallet), feePayer, wallet, 5);
      should(isolated([approve])).equal(false);
    });

    it('rejects a token authority change to the fee payer', function () {
      const setAuthority = createSetAuthorityInstruction(ata(wallet), wallet, AuthorityType.AccountOwner, feePayer);
      should(isolated([setAuthority])).equal(false);
    });

    it('rejects a token transfer into the fee payer token account, classic and Token-2022', function () {
      const toClassic = createTransferCheckedInstruction(ata(wallet), mint, ata(feePayer), wallet, 5, 6);
      should(isolated([advance(feePayer), toClassic])).equal(false);
      const toToken2022 = createTransferCheckedInstruction(
        ata(wallet, TOKEN_2022_PROGRAM_ID),
        mint,
        ata(feePayer, TOKEN_2022_PROGRAM_ID),
        wallet,
        5,
        6,
        [],
        TOKEN_2022_PROGRAM_ID
      );
      should(isolated([advance(feePayer), toToken2022])).equal(false);
    });

    it('rejects a token transfer out of the fee payer token account', function () {
      const fromFeePayer = createTransferCheckedInstruction(ata(feePayer), mint, ata(other), wallet, 5, 6);
      should(isolated([fromFeePayer])).equal(false);
    });

    it('rejects a plain token Transfer, which names no mint, whoever the destination is', function () {
      // the sponsored builders use TransferChecked; a plain Transfer into the fee payer's account cannot be recognised
      for (const program of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
        const plain = (destination: PublicKey) =>
          new TransactionInstruction({
            programId: program,
            keys: [
              { pubkey: ata(wallet, program), isSigner: false, isWritable: true },
              { pubkey: destination, isSigner: false, isWritable: true },
              { pubkey: wallet, isSigner: true, isWritable: false },
            ],
            data: Buffer.from([3, 5, 0, 0, 0, 0, 0, 0, 0]),
          });
        should(isolated([plain(ata(feePayer, program))])).equal(false);
        should(isolated([plain(ata(other, program))])).equal(false);
      }
    });

    it('rejects a transfer of SOL into the fee payer wrapped-SOL token account', function () {
      const wrappedSolAccount = PublicKey.findProgramAddressSync(
        [feePayer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), NATIVE_MINT.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      )[0];
      should(isolated([advance(feePayer), transfer(wallet, wrappedSolAccount)])).equal(false);
    });

    it('rejects a pool deposit that mints the pool tokens into the fee payer token account', function () {
      // the pool mint is one of the instruction accounts, whichever program the instruction belongs to
      const poolProgram = key();
      const poolMint = key();
      const deposit = new TransactionInstruction({
        programId: poolProgram,
        keys: [
          { pubkey: key(), isSigner: false, isWritable: true },
          { pubkey: wallet, isSigner: true, isWritable: true },
          { pubkey: ata(feePayer), isSigner: false, isWritable: true },
          { pubkey: poolMint, isSigner: false, isWritable: true },
        ],
        data: Buffer.from([14, 1, 0, 0, 0, 0, 0, 0, 0]),
      });
      const poolAtaOfFeePayer = PublicKey.findProgramAddressSync(
        [feePayer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), poolMint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      )[0];
      deposit.keys[2].pubkey = poolAtaOfFeePayer;
      should(isolated([deposit])).equal(false);
      deposit.keys[2].pubkey = ata(other);
      should(isolated([deposit])).equal(true);
    });

    it('rejects the fee payer as the payer of a confidential-transfer account reallocation', function () {
      // wallet-platform sponsors no confidential-transfer instruction, so none is exempted
      const reallocate = createReallocateInstruction(
        ata(wallet, TOKEN_2022_PROGRAM_ID),
        feePayer,
        [ExtensionType.ConfidentialTransferAccount],
        wallet,
        [],
        TOKEN_2022_PROGRAM_ID
      );
      should(isolated([reallocate])).equal(false);
    });
  });
});
