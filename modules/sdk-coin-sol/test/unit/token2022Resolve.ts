import 'should';

import { getExtraAccountMetaAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';

import {
  TOKEN_ACL_FLAG_ACCOUNT_SEED,
  TOKEN_ACL_MINT_CONFIG_SEED,
  TOKEN_ACL_PROGRAM_ID,
  TOKEN_ACL_THAW_EXTRA_METAS_SEED,
} from '../../src/lib/constants';
import { ExtraAccountMeta } from '../../src/lib/iface';
import {
  SolAccountFetcher,
  buildSolAccountConnection,
  resolvePermissionlessThaw,
  resolveTransferHookAccounts,
} from '../../src/lib/token2022Resolve';
import * as resources from '../resources/sol';

// Build a fake `Connection` backed by an in-memory address->account map via the
// production `buildSolAccountConnection` shim (also exercising that factory).
type FakeAccount = { data: Buffer; owner: string };
const makeConnection = (accounts: Record<string, FakeAccount>): Connection => {
  const fetch: SolAccountFetcher = async (address: string) => {
    const account = accounts[address];
    if (!account) {
      return null;
    }
    return {
      executable: false,
      owner: new PublicKey(account.owner),
      lamports: 1,
      data: account.data,
      rentEpoch: 0,
    };
  };
  return buildSolAccountConnection(fetch);
};

// Token-2022 mint account layout: 82-byte base MintLayout, padded to the 165-byte
// account size, an account-type byte (1 = Mint), then the extension TLV. TransferHook
// is extension type 14 with 64 bytes (authority + programId).
const buildMintWithTransferHook = (mintDecimals: number, hookProgram: PublicKey): Buffer => {
  const data = Buffer.alloc(234);
  data.writeUInt8(mintDecimals, 44); // MintLayout.decimals
  data.writeUInt8(1, 45); // MintLayout.isInitialized
  data.writeUInt8(1, 165); // AccountType.Mint
  data.writeUInt16LE(14, 166); // extension type: TransferHook
  data.writeUInt16LE(64, 168); // extension length
  hookProgram.toBuffer().copy(data, 202); // programId occupies [202, 234)
  return data;
};

// Plain SPL/Token-2022 mint with no extensions (base MintLayout only).
const buildBaseMint = (mintDecimals: number): Buffer => {
  const data = Buffer.alloc(82);
  data.writeUInt8(mintDecimals, 44);
  data.writeUInt8(1, 45);
  return data;
};

// MintConfig layout: u8 discriminator, u8 bump, bool thaw, bool freeze, pubkey mint(32),
// pubkey freezeAuthority(32), pubkey gatingProgram(32). Total 100 bytes.
const buildMintConfig = (mint: PublicKey, enablePermissionlessThaw: boolean, gateProgram: PublicKey): Buffer => {
  const data = Buffer.alloc(100);
  data.writeUInt8(1, 0); // discriminator
  data.writeUInt8(255, 1); // bump
  data.writeUInt8(enablePermissionlessThaw ? 1 : 0, 2);
  data.writeUInt8(0, 3); // enablePermissionlessFreeze
  mint.toBuffer().copy(data, 4);
  new PublicKey(TOKEN_ACL_PROGRAM_ID).toBuffer().copy(data, 36); // freezeAuthority
  gateProgram.toBuffer().copy(data, 68);
  return data;
};

// ExtraAccountMetaList account: u64 discriminator + u32 length + u32 count, then 35-byte
// ExtraAccountMeta entries (discriminator 0 = fixed address).
const buildExtraAccountMetaList = (metas: ExtraAccountMeta[]): Buffer => {
  const headerSize = 16;
  const data = Buffer.alloc(headerSize + metas.length * 35);
  data.writeUInt32LE(4 + metas.length * 35, 8); // length
  data.writeUInt32LE(metas.length, 12); // count
  let offset = headerSize;
  for (const meta of metas) {
    data.writeUInt8(0, offset); // discriminator: fixed address
    new PublicKey(meta.pubkey).toBuffer().copy(data, offset + 1); // addressConfig
    data.writeUInt8(meta.isSigner ? 1 : 0, offset + 33);
    data.writeUInt8(meta.isWritable ? 1 : 0, offset + 34);
    offset += 35;
  }
  return data;
};

describe('token2022Resolve (standalone)', () => {
  const mintAddress = resources.sol2022TokenTransfers.mint;
  const sourceAddress = resources.associatedTokenAccountsForSol2022.accounts[0].ata;
  const destinationAddress = resources.sol2022TokenTransfers.source;
  const ownerAddress = resources.sol2022TokenTransfers.owner;
  const decimals = 6;
  // Arbitrary but valid base58 pubkeys used purely as fixtures.
  const hookProgramId = new PublicKey('GbQ8ZiEFzGGTeYoXwtZtcoxwPcMyUcmZDduMVNdUPKpX');

  describe('resolveTransferHookAccounts', () => {
    const extraMetas: ExtraAccountMeta[] = [
      { pubkey: '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ', isSigner: false, isWritable: true },
      { pubkey: '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A', isSigner: false, isWritable: false },
      { pubkey: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm', isSigner: false, isWritable: false },
    ];

    it('resolves the ordered extra accounts for a mint with a transfer hook', async function () {
      const validationStatePubkey = getExtraAccountMetaAddress(new PublicKey(mintAddress), hookProgramId);
      const connection = makeConnection({
        [mintAddress]: {
          data: buildMintWithTransferHook(decimals, hookProgramId),
          owner: TOKEN_2022_PROGRAM_ID.toBase58(),
        },
        [validationStatePubkey.toBase58()]: {
          data: buildExtraAccountMetaList(extraMetas),
          owner: hookProgramId.toBase58(),
        },
      });

      const result = await resolveTransferHookAccounts(connection, {
        mint: mintAddress,
        source: sourceAddress,
        destination: destinationAddress,
        owner: ownerAddress,
        amount: '500000',
      });

      // extra accounts, then the hook program, then the validation state account
      result.should.have.length(extraMetas.length + 2);
      result.slice(0, extraMetas.length).should.deepEqual(extraMetas);
      result[extraMetas.length].should.deepEqual({
        pubkey: hookProgramId.toBase58(),
        isSigner: false,
        isWritable: false,
      });
      result[extraMetas.length + 1].should.deepEqual({
        pubkey: validationStatePubkey.toBase58(),
        isSigner: false,
        isWritable: false,
      });
    });

    it('returns an empty array for a mint without a transfer hook', async function () {
      const connection = makeConnection({
        [mintAddress]: {
          data: buildBaseMint(decimals),
          owner: TOKEN_2022_PROGRAM_ID.toBase58(),
        },
      });

      const result = await resolveTransferHookAccounts(connection, {
        mint: mintAddress,
        source: sourceAddress,
        destination: destinationAddress,
        owner: ownerAddress,
        amount: '500000',
      });
      result.should.deepEqual([]);
    });

    it('returns an empty array when the mint account is not found', async function () {
      const connection = makeConnection({});

      const result = await resolveTransferHookAccounts(connection, {
        mint: mintAddress,
        source: sourceAddress,
        destination: destinationAddress,
        owner: ownerAddress,
        amount: '500000',
      });
      result.should.deepEqual([]);
    });
  });

  describe('resolvePermissionlessThaw', () => {
    const tokenAccount = resources.associatedTokenAccountsForSol2022.accounts[0].ata;
    const tokenAccountOwner = resources.sol2022TokenTransfers.owner;
    const authority = resources.sol2022TokenTransfers.source;
    const gatingProgram = new PublicKey('GbQ8ZiEFzGGTeYoXwtZtcoxwPcMyUcmZDduMVNdUPKpX');
    const tokenAclProgramId = new PublicKey(TOKEN_ACL_PROGRAM_ID);

    const extraMetas: ExtraAccountMeta[] = [
      { pubkey: '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ', isSigner: false, isWritable: true },
      { pubkey: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm', isSigner: false, isWritable: false },
    ];

    const [mintConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_ACL_MINT_CONFIG_SEED), new PublicKey(mintAddress).toBuffer()],
      tokenAclProgramId
    );
    const [flagAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_ACL_FLAG_ACCOUNT_SEED), new PublicKey(tokenAccount).toBuffer()],
      tokenAclProgramId
    );
    const [thawExtraMetasPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(TOKEN_ACL_THAW_EXTRA_METAS_SEED), new PublicKey(mintAddress).toBuffer()],
      gatingProgram
    );

    it('resolves the thaw params for a Token ACL mint with permissionless thaw enabled', async function () {
      const connection = makeConnection({
        [mintConfigPda.toBase58()]: {
          data: buildMintConfig(new PublicKey(mintAddress), true, gatingProgram),
          owner: TOKEN_ACL_PROGRAM_ID,
        },
        [thawExtraMetasPda.toBase58()]: {
          data: buildExtraAccountMetaList(extraMetas),
          owner: gatingProgram.toBase58(),
        },
      });

      const result = await resolvePermissionlessThaw(connection, {
        mint: mintAddress,
        tokenAccount,
        tokenAccountOwner,
        authority,
      });

      result.applicable.should.be.true();
      result.gatingProgram!.should.equal(gatingProgram.toBase58());
      result.flagAccount!.should.equal(flagAccountPda.toBase58());
      result.mintConfig!.should.equal(mintConfigPda.toBase58());
      result.tokenProgram!.should.equal(TOKEN_2022_PROGRAM_ID.toBase58());
      result.systemProgram!.should.equal(SystemProgram.programId.toBase58());
      // extra accounts = [thawExtraMetas, ...resolved fixed-address extras]
      result.extraAccounts!.should.deepEqual([
        { pubkey: thawExtraMetasPda.toBase58(), isSigner: false, isWritable: false },
        ...extraMetas,
      ]);
    });

    it('returns applicable:false for a mint with no Token ACL MintConfig', async function () {
      const connection = makeConnection({});

      const result = await resolvePermissionlessThaw(connection, {
        mint: mintAddress,
        tokenAccount,
        tokenAccountOwner,
        authority,
      });
      result.should.deepEqual({ applicable: false });
    });

    it('returns applicable:false when permissionless thaw is disabled', async function () {
      const connection = makeConnection({
        [mintConfigPda.toBase58()]: {
          data: buildMintConfig(new PublicKey(mintAddress), false, gatingProgram),
          owner: TOKEN_ACL_PROGRAM_ID,
        },
      });

      const result = await resolvePermissionlessThaw(connection, {
        mint: mintAddress,
        tokenAccount,
        tokenAccountOwner,
        authority,
      });
      result.should.deepEqual({ applicable: false });
    });
  });
});
