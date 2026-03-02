import should from 'should';
import nock from 'nock';
import { TransactionBuilderFactory, IrysCommitmentTransactionBuilder, CommitmentTypeId } from '../../src/lib';
import { encodeBase58 } from '../../src/lib/utils';

describe('TransactionBuilderFactory', function () {
  const testnetCoinConfig = {
    name: 'tirys',
    network: { chainId: 1270 },
  } as any;

  const mainnetCoinConfig = {
    name: 'irys',
    network: { chainId: 3282 },
  } as any;

  it('should create factory with testnet config', function () {
    const factory = new TransactionBuilderFactory(testnetCoinConfig);
    should.exist(factory);
    const builder = factory.getCommitmentTransactionBuilder();
    should.exist(builder);
    builder.should.be.instanceOf(IrysCommitmentTransactionBuilder);
  });

  it('should create factory with mainnet config', function () {
    const factory = new TransactionBuilderFactory(mainnetCoinConfig);
    const builder = factory.getCommitmentTransactionBuilder();
    should.exist(builder);
  });

  it('getCommitmentTransactionBuilder should return new builder each time', function () {
    const factory = new TransactionBuilderFactory(testnetCoinConfig);
    const b1 = factory.getCommitmentTransactionBuilder();
    const b2 = factory.getCommitmentTransactionBuilder();
    b1.should.not.equal(b2);
  });
});

describe('getCommitmentTransactionBuilder (standard API)', function () {
  const testAnchor = new Uint8Array(32).fill(1);
  const testSignerHex = '0x' + '02'.repeat(20);
  const testnetCoinConfig = { name: 'tirys', network: { chainId: 1270 } } as any;

  afterEach(function () {
    nock.cleanAll();
  });

  it('should build STAKE with serializedTxHex and signableHex (mock anchor)', async function () {
    const mockAnchorBase58 = encodeBase58(testAnchor);
    nock('https://testnet.irys.xyz').get('/v1/anchor').reply(200, { blockHash: mockAnchorBase58 });

    const factory = new TransactionBuilderFactory(testnetCoinConfig);
    const txBuilder = factory.getCommitmentTransactionBuilder();

    txBuilder.setCommitmentType('STAKE').setSigner(testSignerHex).setFee('1000').setValue('5000');

    const tx = await txBuilder.build();

    tx.should.have.property('serializedTxHex');
    tx.should.have.property('signableHex');
    tx.should.have.property('fields');

    tx.serializedTxHex.should.be.a.String();
    tx.serializedTxHex.should.match(/^[0-9a-f]+$/);
    tx.signableHex.should.be.a.String();
    tx.signableHex.should.have.length(64);
    tx.signableHex.should.match(/^[0-9a-f]+$/);
    tx.fields.commitmentType.should.deepEqual({ type: CommitmentTypeId.STAKE });
    tx.coinSpecific.should.deepEqual({ keyServerPathPrefix: 'irys' });
  });

  it('should build PLEDGE with setPledgeCount and return serializedTxHex/signableHex', async function () {
    const mockAnchorBase58 = encodeBase58(testAnchor);
    nock('https://testnet.irys.xyz').get('/v1/anchor').reply(200, { blockHash: mockAnchorBase58 });

    const factory = new TransactionBuilderFactory(testnetCoinConfig);
    const txBuilder = factory.getCommitmentTransactionBuilder();

    txBuilder.setCommitmentType('PLEDGE').setPledgeCount(5).setSigner(testSignerHex).setFee('1000').setValue('5000');

    const tx = await txBuilder.build();

    tx.serializedTxHex.should.be.a.String();
    tx.signableHex.should.have.length(64);
    tx.fields.commitmentType.should.deepEqual({ type: CommitmentTypeId.PLEDGE, pledgeCount: 5n });
    tx.coinSpecific.keyServerPathPrefix.should.equal('irys');
  });

  it('should accept setChainId and use it for build', async function () {
    const mockAnchorBase58 = encodeBase58(testAnchor);
    nock('https://testnet.irys.xyz').get('/v1/anchor').reply(200, { blockHash: mockAnchorBase58 });

    const factory = new TransactionBuilderFactory(testnetCoinConfig);
    const txBuilder = factory.getCommitmentTransactionBuilder();

    txBuilder.setCommitmentType('STAKE').setSigner(testSignerHex).setChainId(1270).setFee('1000').setValue('5000');

    const tx = await txBuilder.build();
    tx.fields.chainId.should.equal(1270n);
  });

  it('should accept signer without 0x prefix', async function () {
    const mockAnchorBase58 = encodeBase58(testAnchor);
    nock('https://testnet.irys.xyz').get('/v1/anchor').reply(200, { blockHash: mockAnchorBase58 });

    const signerNoPrefix = '02'.repeat(20);
    const factory = new TransactionBuilderFactory(testnetCoinConfig);
    const txBuilder = factory.getCommitmentTransactionBuilder();

    txBuilder.setCommitmentType('STAKE').setSigner(signerNoPrefix).setFee('1000').setValue('5000');

    const tx = await txBuilder.build();
    tx.serializedTxHex.should.be.a.String();
    tx.signableHex.should.have.length(64);
  });

  it('should throw on invalid signer address length', async function () {
    const factory = new TransactionBuilderFactory(testnetCoinConfig);
    const txBuilder = factory.getCommitmentTransactionBuilder();

    txBuilder.setCommitmentType('STAKE').setFee('1000').setValue('5000');
    (() => txBuilder.setSigner('0x1234')).should.throw(/Invalid hex address length/);
  });
});
