import should from 'should';
import sinon from 'sinon';
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { NetworkType } from '@bitgo/statics';

import {
  fetchExtensionAccounts,
  ExtensionType,
  TransferHookLayout,
  ExtraAccountMetaAccountDataLayout,
  ExtraAccountMetaLayout,
} from '../../src/lib/token2022Extensions';
import { Buffer } from 'buffer';

type AccountMetaEntry = {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
};

describe('token2022Extensions', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    sandbox.stub(console, 'debug');
    sandbox.stub(console, 'error');
    sandbox.stub(console, 'warn');
    sandbox.stub(console, 'log');
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns transfer hook extra accounts for a single entry', async function () {
    const mintAddress = '3BW95VLH2za2eUQ1PGfjxwMbpsnDFnmkA7m5LDgMKbX7';
    const authority = new PublicKey('5Uf3MDczwvnMRyKKx5vGnYDHzLeFjjdFz3XJPjfR5Fuj');
    const programId = new PublicKey('7NL6tb2cqDfMvKEtDpPuMBU5wUmYrmzJwNYDhGJMMXKA');
    const extraMeta = new PublicKey('8VkqFGMvByZevRFGW5vGnYDHzLeFjjdFz3XJPjfR5Fuj');

    const mintTlv = buildTransferHookTlv(authority, programId);
    const extraMetaAccountData = buildExtraAccountMetaData([{ pubkey: extraMeta, isSigner: false, isWritable: true }]);

    const getAccountInfoStub = sandbox.stub(Connection.prototype, 'getAccountInfo');
    getAccountInfoStub.onFirstCall().resolves(mockMintAccount(mintTlv));
    getAccountInfoStub.onSecondCall().resolves({
      ...mockMintAccount(),
      data: extraMetaAccountData,
      owner: programId,
    });

    const result = await fetchExtensionAccounts(mintAddress, NetworkType.TESTNET);

    should.exist(result);
    const accounts = result ?? [];
    accounts.should.have.length(1);
    accounts[0].pubkey.equals(extraMeta).should.be.true();
    accounts[0].isSigner.should.be.false();
    accounts[0].isWritable.should.be.true();
    getAccountInfoStub.calledTwice.should.be.true();
  });

  it('returns all extra accounts and preserves signer flags', async function () {
    const mintAddress = '2MkHRHX3FSRs4Lg8LXswLf7qFP3qfpSZmD6Zm3jHZKbB';
    const authority = new PublicKey('7GMGkC7yUoHEvW7L3AfkuL6Kq8EV9drpWNQDyXLKArv2');
    const programId = new PublicKey('7TG7Wcnc5gcN6nSV7BpwuemhUXeyPZ2wWfZc9xry5yt3');

    const accountEntries: AccountMetaEntry[] = [
      { pubkey: new PublicKey('5pw4HHVfSvACNaPjA1kCBv3MiNHsftFQp6A8W2XAcw9C'), isSigner: false, isWritable: true },
      { pubkey: new PublicKey('9ieDnJ7TWMBaC6wpd1JrFmgbeYh9y5zfkCUw9YGkmMbr'), isSigner: true, isWritable: false },
      { pubkey: new PublicKey('5XyfTzdSowAgF4oXhrKexTeByNuYNaksaKMJtRvAiSkf'), isSigner: true, isWritable: true },
    ];

    const mintTlv = buildTransferHookTlv(authority, programId);
    const extraMetaAccountData = buildExtraAccountMetaData(accountEntries);

    const extraMetaPda = PublicKey.findProgramAddressSync(
      [Buffer.from('extra-account-metas'), new PublicKey(mintAddress).toBuffer()],
      programId
    )[0];

    const getAccountInfoStub = sandbox.stub(Connection.prototype, 'getAccountInfo');
    getAccountInfoStub.onFirstCall().resolves(mockMintAccount(mintTlv));
    getAccountInfoStub.onSecondCall().callsFake(async (pubkey: PublicKey) => {
      pubkey.equals(extraMetaPda).should.be.true();
      return {
        ...mockMintAccount(),
        data: extraMetaAccountData,
        owner: programId,
      };
    });

    const result = await fetchExtensionAccounts(mintAddress, NetworkType.TESTNET);

    should.exist(result);
    const accounts = result ?? [];
    accounts.should.have.length(accountEntries.length);
    accounts.forEach((meta, index) => {
      meta.pubkey.equals(accountEntries[index].pubkey).should.be.true();
      meta.isSigner.should.equal(accountEntries[index].isSigner);
      meta.isWritable.should.equal(accountEntries[index].isWritable);
    });
    getAccountInfoStub.calledTwice.should.be.true();
  });
});
function buildTransferHookTlv(authority: PublicKey, programId: PublicKey): Buffer {
  const tlv = Buffer.alloc(4 + TransferHookLayout.span);
  tlv.writeUInt16LE(ExtensionType.TransferHook, 0);
  tlv.writeUInt16LE(TransferHookLayout.span, 2);
  TransferHookLayout.encode({ authority, programId }, tlv, 4);
  return tlv;
}

function buildExtraAccountMetaData(entries: AccountMetaEntry[]): Buffer {
  const extraAccounts = entries.map((entry) => ({
    discriminator: 0,
    addressConfig: entry.pubkey.toBuffer(),
    isSigner: entry.isSigner,
    isWritable: entry.isWritable,
  }));

  const bufferLength = 8 + 4 + 4 + ExtraAccountMetaLayout.span * entries.length;
  const buffer = Buffer.alloc(bufferLength);

  ExtraAccountMetaAccountDataLayout.encode(
    {
      instructionDiscriminator: BigInt(0),
      length: 4 + ExtraAccountMetaLayout.span * entries.length,
      extraAccountsList: {
        count: entries.length,
        extraAccounts,
      },
    },
    buffer
  );

  return buffer;
}

function mockMintAccount(tlvData?: Buffer): AccountInfo<Buffer> {
  const hasTlv = !!tlvData && tlvData.length > 0;
  const dataLength = hasTlv ? splToken.ACCOUNT_SIZE + splToken.ACCOUNT_TYPE_SIZE + tlvData!.length : splToken.MINT_SIZE;
  const data = Buffer.alloc(dataLength);
  splToken.MintLayout.encode(
    {
      mintAuthorityOption: 0,
      mintAuthority: splToken.TOKEN_PROGRAM_ID,
      supply: BigInt(0),
      decimals: 0,
      isInitialized: true,
      freezeAuthorityOption: 0,
      freezeAuthority: splToken.TOKEN_PROGRAM_ID,
    },
    data
  );

  if (hasTlv) {
    data[splToken.ACCOUNT_SIZE] = splToken.AccountType.Mint;
    tlvData!.copy(data, splToken.ACCOUNT_SIZE + splToken.ACCOUNT_TYPE_SIZE);
  }

  return {
    data,
    executable: false,
    lamports: 0,
    owner: splToken.TOKEN_2022_PROGRAM_ID,
    rentEpoch: 0,
  } as AccountInfo<Buffer>;
}
